import { NFTStorage, Blob } from "nft.storage";
import PinataClient from "@pinata/sdk";
import fs from "fs";
import mime from "mime-types";

type Providers = "nft.storage" | "pinata";

type ProviderSecrets = {
  pinataApiKey?: string;
  pinataSecretApiKey?: string;
  pinataJwt?: string;
  storageToken?: string;
};

export class IpfsUploader {
  provider: Providers;
  private nftstorageClient?: NFTStorage;
  private pinataClient?: PinataClient;

  constructor(provider: Providers, secrets: ProviderSecrets) {
    this.provider = provider;

    if (this.provider === "nft.storage") {
      if (!secrets.storageToken) {
        throw new Error("storageToken is required for nft.storage client");
      }
      this.nftstorageClient = new NFTStorage({ token: secrets.storageToken });
    } else if (this.provider === "pinata") {
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

  private async pinataImageUpload(path: string, filename: string): Promise<string> {
    const file = fs.createReadStream(path);
    const result = await this.pinataClient!.pinFileToIPFS(file, {
      pinataMetadata: { name: filename },
      pinataOptions: { cidVersion: 0, wrapWithDirectory: false },
    });
    return result.IpfsHash;
  }

  private async nftstorageImageUpload(path: string, filename: string): Promise<string> {
    const mimeType = mime.lookup(filename) || "application/octet-stream";
    const blob = new Blob([await fs.promises.readFile(path)], { type: mimeType });
    const result = await this.nftstorageClient!.storeBlob(blob);
    return result;
  }

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

  private async nftstorageJsonUpload(json: object): Promise<string> {
    const cid = await this.nftstorageClient!.storeBlob(
      new Blob([JSON.stringify(json)], { type: "application/json" })
    );
    return cid;
  }

  private async pinataJsonUpload(json: object): Promise<string> {
    const result = await this.pinataClient!.pinJSONToIPFS(json, {
      pinataOptions: { cidVersion: 0, wrapWithDirectory: false },
    });
    return result.IpfsHash;
  }

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
