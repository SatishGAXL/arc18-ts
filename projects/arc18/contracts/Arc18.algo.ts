import { Contract } from '@algorandfoundation/tealscript';

// Interface defining the structure for royalty policies
interface RoyaltyPolicy {
  royalty_basis: uint64; // The percentage of the payment due, specified in basis points (0-10,000)
  royalty_recipient: string; // The address that should collect the payment
}

// Interface defining the structure for asset offers
interface AssetOffer {
  auth_address: Address; // The address of a marketplace or account that may issue a transfer request
  offered_amount: uint64; // The number of units being offered
}

const max_royalty_basis = 100 * 100; // Maximum royalty basis (100%)

// Main Arc18 contract class
export class Arc18 extends Contract {
  // Global state key to store the administrator address
  administrator = GlobalStateKey<Address>({ key: 'administrator' });
  // Global state key to store the royalty basis
  royalty_basis = GlobalStateKey<uint64>({ key: 'royalty_basis' });
  // Global state key to store the royalty receiver address
  royalty_receiver = GlobalStateKey<Address>({ key: 'royalty_receiver' });

  // Local state map to store asset offers for each account
  offers = LocalStateMap<AssetID, AssetOffer>({ maxKeys: 1 });

  // Method to opt-in to the application (currently empty)
  optInToApplication(): void {
    
  }

  // Private method to check if the sender is the administrator
  private from_administrator(): boolean {
    if (this.administrator.value == this.txn.sender) {
      return true;
    } else {
      return false;
    }
  }

  // Private method to calculate the royalty amount
  private royalty_amount(amount: uint64, royalty_basis: uint64): uint64 {
    return (amount * royalty_basis) / max_royalty_basis;
  }

  // Private method to pay Algos, splitting the payment between the owner and royalty receiver
  private pay_algos(amount: uint64, owner: Address, royalty_receiver: Address, royalty_basis: uint64) {
    const royalty_amount = this.royalty_amount(amount, royalty_basis);
    sendPayment({ receiver: owner, amount: amount - royalty_amount, fee: 0 });
    if (royalty_amount > 0) {
      sendPayment({ receiver: royalty_receiver, amount: royalty_amount, fee: 0 });
    }
  }

  // Private method to pay Assets, splitting the payment between the owner and royalty receiver
  private pay_assets(asset: AssetID, amount: uint64, owner: Address, royalty_receiver: Address, royalty_basis: uint64) {
    const royalty_amount = this.royalty_amount(amount, royalty_basis);
    sendAssetTransfer({ assetReceiver: owner, assetAmount: amount - royalty_amount, xferAsset: asset, fee: 0 });
    if (royalty_amount > 0) {
      sendAssetTransfer({ assetReceiver: royalty_receiver, assetAmount: royalty_amount, xferAsset: asset, fee: 0 });
    }
  }

  // Private method to update the offered amount of an asset
  private update_offer_amount(owner: Address, asset: AssetID, new_amt: uint64) {
    this.offers(owner, asset).value.offered_amount = new_amt;
  }

  // Method to set a new administrator
  set_administrator(new_admin: Address) {
    assert(this.from_administrator(), 'Not an Admin'); // check to allow only current admin to modify
    this.administrator.value = new_admin;
  }

  // Method to create the application and set the creator as the administrator
  createApplication() {
    this.administrator.value = this.txn.sender; // sets creator as admin
  }

  // Method to set the royalty policy
  set_policy(royalty_basis: uint64, royalty_receiver: Address) {
    assert(this.from_administrator(), 'Not an Admin'); // check to allow only current admin to modify
    assert(!this.royalty_basis.exists || !this.royalty_receiver.exists, 'Policy Has Already set');
    assert(royalty_basis <= max_royalty_basis, 'Royality Basis Has Exceeded Max Value');
    this.royalty_basis.value = royalty_basis;
    this.royalty_receiver.value = royalty_receiver;
  }

  // Method to set whether a payment asset is allowed
  set_payment_asset(payment_asset: AssetID, is_allowed: boolean) {
    assert(this.from_administrator(), 'Not an Admin'); // check to allow only current admin to modify
    const is_opted = this.app.address.isOptedInToAsset(payment_asset);
    if (!is_opted && is_allowed) {
      sendAssetTransfer({ assetAmount: 0, assetReceiver: this.app.address, xferAsset: payment_asset });
    } else if (is_opted && !is_allowed) {
      sendAssetTransfer({
        assetAmount: 0,
        assetReceiver: payment_asset.creator,
        assetCloseTo: payment_asset.creator,
        xferAsset: payment_asset,
      });
    }
  }

  // Method to transfer Algo payment with royalty
  transfer_algo_payment(
    royalty_asset: AssetID,
    royalty_asset_amount: uint64,
    from: Address,
    to: Address,
    royalty_receiver: Address,
    payment: PayTxn,
    current_offer_amount: uint64
  ) {
    assert(this.royalty_basis.exists && this.royalty_receiver.exists, 'Policy Not set');
    assert(this.offers(from, royalty_asset).exists, 'Royalty Asset Offer Not Available');
    assert(globals.groupSize == 2, 'Group Size Must be 2');

    const offer = this.offers(from, royalty_asset).value;
    const saved_royalty_receiver = this.royalty_receiver.value;
    const saved_royalty_basis = this.royalty_basis.value;

    assert(offer.auth_address == this.txn.sender, 'Only Authorized Address can send this transaction');
    assert(payment.rekeyTo == globals.zeroAddress, 'Rekeyed Accounts are Not Allowed');
    assert(royalty_asset_amount <= offer.offered_amount, 'Requested Amount is Greater than Offered Amount');
    assert(royalty_receiver == saved_royalty_receiver, 'Royality Receiver Mismatched');
    assert(current_offer_amount == offer.offered_amount, 'Current Offer Amount Mismatch');
    verifyPayTxn(payment, {
      rekeyTo: globals.zeroAddress,
      closeRemainderTo: globals.zeroAddress,
      sender: offer.auth_address,
      receiver: this.app.address,
    });

    this.pay_algos(payment.amount, from, royalty_receiver, saved_royalty_basis);

    sendAssetTransfer({
      assetAmount: royalty_asset_amount,
      assetReceiver: to,
      assetSender: from,
      fee: 0,
      xferAsset: royalty_asset,
    });

    this.update_offer_amount(from, royalty_asset, offer.offered_amount - royalty_asset_amount);
  }

  // Method to transfer Asset payment with royalty
  transfer_asset_payment(
    royalty_asset: AssetID,
    royalty_asset_amount: uint64,
    from: Address,
    to: Address,
    royalty_receiver: Address,
    payment: AssetTransferTxn,
    payment_asset: AssetID,
    current_offer_amount: uint64
  ) {
    assert(this.royalty_basis.exists && this.royalty_receiver.exists, 'Policy Not set');
    assert(this.offers(from, royalty_asset).exists, 'Royalty Asset Offer Not Available');
    assert(globals.groupSize == 2, 'Group Size Must be 2');

    const offer = this.offers(from, royalty_asset).value;
    const saved_royalty_receiver = this.royalty_receiver.value;
    const saved_royalty_basis = this.royalty_basis.value;

    assert(offer.auth_address == this.txn.sender, 'Only Authorized Address can send this transaction');
    assert(payment.rekeyTo == globals.zeroAddress, 'Rekeyed Accounts are Not Allowed');
    assert(royalty_asset_amount <= offer.offered_amount, 'Requested Amount is Greater than Offered Amount');
    assert(royalty_receiver == saved_royalty_receiver, 'Royality Receiver Mismatched');
    assert(current_offer_amount == offer.offered_amount, 'Current Offer Amount Mismatch');
    verifyAssetTransferTxn(payment, {
      rekeyTo: globals.zeroAddress,
      sender: offer.auth_address,
      assetReceiver: this.app.address,
      xferAsset: payment_asset,
      assetCloseTo: globals.zeroAddress,
    });

    this.pay_assets(payment_asset, payment.assetAmount, from, royalty_receiver, saved_royalty_basis);

    sendAssetTransfer({
      assetAmount: royalty_asset_amount,
      assetReceiver: to,
      assetSender: from,
      fee: 0,
      xferAsset: royalty_asset,
    });

    this.update_offer_amount(from, royalty_asset, offer.offered_amount - royalty_asset_amount);
  }

  // Method to create an offer for a royalty asset
  offer(
    royalty_asset: AssetID,
    royalty_asset_amount: uint64,
    auth_address: Address,
    offered_amount: uint64,
    offered_auth_addr: Address
  ) {
    assert(this.royalty_basis.exists && this.royalty_receiver.exists, 'Policy Not set');
    assert(royalty_asset.clawback == this.app.address, "App doesn't have clawback on this asset");
    assert(
      royalty_asset_amount >= this.txn.sender.assetBalance(royalty_asset),
      'Asset Amount provided is greater than asset Holding'
    );
    assert(
      royalty_asset.freeze == globals.zeroAddress || royalty_asset.freeze == this.app.address,
      'Invalid Freeze Value For asset'
    );
    assert(
      royalty_asset.manager == globals.zeroAddress || royalty_asset.manager == this.app.address,
      'Invalid Manager Value For asset'
    );

    this.offers(this.txn.sender, royalty_asset).value = {
      auth_address: auth_address,
      offered_amount: royalty_asset_amount,
    };
  }

  // Method for a royalty-free move of assets
  royalty_free_move(
    royalty_asset: AssetID,
    royalty_asset_amount: uint64,
    from: Address,
    to: Address,
    offered_amount: uint64
  ) {
    assert(this.offers(from, royalty_asset).exists, 'Royalty Asset Offer Not Available');
    const offer = this.offers(from, royalty_asset).value;
    assert(offer.offered_amount == offered_amount, 'Given Offered Amount is not same as in offer');
    assert(offered_amount >= royalty_asset_amount, 'requested amount is greater than offered amount');
    assert(offer.auth_address == this.txn.sender, 'Only Authorized Address can send this transaction');
  }

  // Method to get the royalty policy
  get_policy(): [Address, uint64] {
    assert(this.royalty_basis.exists && this.royalty_receiver.exists, 'Policy Not set');
    return [this.royalty_receiver.value, this.royalty_basis.value];
  }

  // Method to get an asset offer
  get_offer(royalty_asset: AssetID, from: Address): [Address, uint64] {
    assert(this.offers(from, royalty_asset).exists, "Offer Doesn't Exists");
    const offer = this.offers(from, royalty_asset).value;
    return [offer.auth_address, offer.offered_amount];
  }

  // Method to get the administrator
  get_administrator(): Address {
    return this.administrator.value;
  }
}
