export interface FormitizeInvoice {
  id: number;
  invoiceNumber: string;
  invoiceDate: number;
  invoiceDateFormatted: string;
  expectedPayDate: number;
  expectedPayDateFormatted: string;
  clientID: number;
  companyName: string;
  primaryAddress: string;
  primaryContactName: string;
  primaryContactPhone: string;
  primaryContactEmail: string;
  client: {
    id: number;
    billingName: string;
  };
  contact: {
    name: string;
    email: string;
    mobile: string;
  };
  orderNumber: string;
  reference: string;
  addressTo: string;
  currency: string;
  status: string;
  type: string;
  lineItems: FormitizeLineItem[];
  taxType: string;
  tax: number;
  subtotal: number;
  total: number;
  amountPaid: number;
  payments: any[];
  attachedTo: {
    job: number[];
    quote: string[];
  };
  history: FormitizeHistory[];
}

export interface FormitizeLineItem {
  id: string;
  code: string;
  description: string;
  quantity: string;
  unitAmount: string;
  discountPercentage: string;
  lineSubtotal: number;
  taxAmount: number;
  lineTotal: number;
}

export interface FormitizeHistory {
  by: string;
  userName: string;
  note: string;
  date: string;
  dateTimestamp: string;
}

export interface FormitizeApiResponse {
  payload: FormitizeInvoice;
}

export interface FormitizeJob {
  id: string;
  maintenanceID: string;
  clientID: string;
  contactID: string;
  billingName: string;
  contactName: string;
  jobNumber: string;
  orderNumber: string;
  invoiceID: string;
  invoiceNumber: string;
  title: string;
  forms: {
    [key: string]: {
      id: string;
      title: string;
      formNumber?: string;
      [key: string]: any; // Para campos adicionales que puedan venir
    };
  };
  location: string;
  description: string;
  dueDate: string;
  assignedTo: string;
  priority: string;
  status: string;
  duration: string;
  statusLabel: string;
  [key: string]: any; // Para campos adicionales que puedan venir de la API
}

export interface FormitizeJobsResponse {
  payload: {
    [key: string]: FormitizeJob;
  };
}

export interface FormitizeSubmittedForm {
  submittedFormID: number | string;
  status: string;
  title: string;
  formID: number | string;
  userID: number | string;
  jobID: number | string;
  dateCreated: number | string;
  dateModified: number | string;
  latitude: string | boolean;
  longitude: string | boolean;
  location: string | boolean;
  formDataLastSaved: number | string;
  dateSubmitted: number | string;
  version: number | string;
  count: string;
  userName?: string;
  formDateCreated?: number | string;
  modifiedBy?: number | string;
  content?: {
    [key: string]: any;
  };
  attachments?: {
    [key: string]: {
      url: string;
      type: string;
      name: string;
    };
  };
  [key: string]: any; // Para campos adicionales
}

export interface FormitizeSubmittedFormsResponse {
  payload: {
    [key: string]: FormitizeSubmittedForm;
  };
}

export interface FormitizeQuote {
  id: string;
  addressTo: string;
  clientID: string;
  total: string;
  subtotal: string;
  tax: string;
  type: string;
  amountPaid: string;
  quoteNumber: string;
  orderNumber: string;
  reference: string;
  statusValue: string;
  status: string;
  currency: string;
  taxTypeValue: string;
  taxType: string;
  paid: string;
  title: string;
  summary: string;
  terms: string;
  attachedTo: any[];
  quoteDate: string;
  quoteDateFormatted: string;
  lastEmailed: string;
  lastEmailedFormatted: string;
  companyname: string;
  primaryAddress: string;
  primaryContact: string;
  primaryContactName: string;
  primaryContactPhone: string;
  primaryContactEmail: string;
  [key: string]: any; // Para campos adicionales
}

export interface FormitizeQuotesResponse {
  payload: FormitizeQuote[];
}

