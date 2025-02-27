import { NFTStorage, Blob } from "nft.storage";
import PinataClient from "@pinata/sdk";
import fs from "fs";
import mime from "mime-types";

// Define the supported IPFS providers
type Providers = "nft.storage" | "pinata";

// Define the structure for provider secrets
type ProviderSecrets = {
  pinataApiKey?: string;
  pinataSecretApiKey?: string;
  pinataJwt?: string;
  storageToken?: string;
};

// Class for uploading files and JSON to IPFS using different providers
export class IpfsUploader {
  provider: Providers;
  private nftstorageClient?: NFTStorage;
  private pinataClient?: PinataClient;

  // Constructor to initialize the IPFS uploader with the specified provider and secrets
  constructor(provider: Providers, secrets: ProviderSecrets) {
    this.provider = provider;

    // Initialize nft.storage client if provider is nft.storage
    if (this.provider === "nft.storage") {
      if (!secrets.storageToken) {
        throw new Error("storageToken is required for nft.storage client");
      }
      this.nftstorageClient = new NFTStorage({ token: secrets.storageToken });
    }
    // Initialize Pinata client if provider is pinata
    else if (this.provider === "pinata") {
      if (secrets.pinataApiKey && secrets.pinataSecretApiKey) {
        this.pinataClient = new PinataClient({
          pinataApiKey: secrets.pinataApiKey,
          pinataSecretApiKey: secrets.pinataSecretApiKey,
        });
      } else if (secrets.pinataJwt) {
        this.pinataClient = new PinataClient({
          pinataJWTKey: secrets.pinataJwt,
        });
      } else {
        throw new Error(
          "(pinataApiKey & pinataSecretApiKey) or pinataJwt is required for pinata client"
        );
      }
    } else {
      throw new Error("Invalid provider specified");
    }
  }

  // Private method to upload an image to Pinata
  private async pinataImageUpload(path: string, filename: string): Promise<string> {
    const file = fs.createReadStream(path);
    const result = await this.pinataClient!.pinFileToIPFS(file, {
      pinataMetadata: { name: filename },
      pinataOptions: { cidVersion: 0, wrapWithDirectory: false },
    });
    return result.IpfsHash;
  }

  // Private method to upload an image to nft.storage
  private async nftstorageImageUpload(path: string, filename: string): Promise<string> {
    const mimeType = mime.lookup(filename) || "application/octet-stream";
    const blob = new Blob([await fs.promises.readFile(path)], { type: mimeType });
    const result = await this.nftstorageClient!.storeBlob(blob);
    return result;
  }

  // Public method to upload an image to IPFS using the selected provider
  async uploadImageToIPFS(path: string, filename: string): Promise<string | undefined> {
    try {
      if (this.provider === "nft.storage") {
        return await this.nftstorageImageUpload(path, filename);
      } else if (this.provider === "pinata") {
        return await this.pinataImageUpload(path, filename);
      }
    } catch (err) {
      console.error("Error uploading image to IPFS:", err);
      throw err;
    }
  }

  // Private method to upload JSON to nft.storage
  private async nftstorageJsonUpload(json: object): Promise<string> {
    const cid = await this.nftstorageClient!.storeBlob(
      new Blob([JSON.stringify(json)], { type: "application/json" })
    );
    return cid;
  }

  // Private method to upload JSON to Pinata
  private async pinataJsonUpload(json: object): Promise<string> {
    const result = await this.pinataClient!.pinJSONToIPFS(json, {
      pinataOptions: { cidVersion: 0, wrapWithDirectory: false },
    });
    return result.IpfsHash;
  }

  // Public method to upload JSON to IPFS using the selected provider
  async uploadJsonToIPFS(json: object): Promise<string | undefined> {
    try {
      if (this.provider === "nft.storage") {
        return await this.nftstorageJsonUpload(json);
      } else if (this.provider === "pinata") {
        return await this.pinataJsonUpload(json);
      }
    } catch (err) {
      console.error("Error uploading JSON to IPFS:", err);
      throw err;
    }
  }
}
