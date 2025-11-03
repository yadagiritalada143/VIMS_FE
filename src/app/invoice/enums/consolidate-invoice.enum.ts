export enum ConsolidateInvoiceTabEnum {
    ClientBill = 'Client Bill',
    VendorBill = 'Vendor Bill',
    ClientPayment = 'Client Payment(s)',
    VendorPayment = 'Vendor Payment(s)',
    CreditDebit = 'Credit/Debit',
}

export enum ConsolidateInvoiceTabList {
    Client = 'client',
    Vendor = 'vendor',
    ClientPayment = 'client_payment',
    SupplierPayment = 'supplier_payment',
    CreditDebit = 'credit_debit',
    History = 'history'
}

export enum IndividualInvoiceHeaderButton {
    ConsolidateInvoice = 'Consolidate Invoice',
    CreditDebit = 'Credit/Debit',
    DownloadData = 'Download Data'
}
export enum IndividualInvoiceTabEnum {
    InProgress = 'in-progress',
}
export enum ConsolidateInvoiceStatus {
    INPROGRESS = 'in progress',
    DRAFT = 'draft',
    APPROVED = 'approved',
    FAILED = 'failed',
    CANCELLED = 'cancelled'
}