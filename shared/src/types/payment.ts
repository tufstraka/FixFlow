/**
 * Payment status
 */
export enum PaymentStatus {
  /** Payment created, not yet processed */
  PENDING = 'PENDING',
  /** Payment is being processed */
  PROCESSING = 'PROCESSING',
  /** Payment successfully completed */
  COMPLETED = 'COMPLETED',
  /** Payment failed */
  FAILED = 'FAILED',
  /** Payment was cancelled */
  CANCELLED = 'CANCELLED',
}

/**
 * Payment data structure
 */
export interface Payment {
  id: string;
  bountyId: string;
  recipientAddress: string;
  amount: number;
  currency: string;
  mneeTicketId: string | null;
  mneeTxId: string | null;
  status: PaymentStatus;
  errorMessage: string | null;
  createdAt: Date;
  processedAt: Date | null;
  completedAt: Date | null;
}

/**
 * Request to process a payment
 */
export interface ProcessPaymentRequest {
  bountyId: string;
  recipientAddress: string;
  amount: number;
}

/**
 * MNEE transfer recipient
 */
export interface MNEERecipient {
  address: string;
  amount: number;
}

/**
 * MNEE transfer response
 */
export interface MNEETransferResponse {
  ticketId?: string;
  rawtx?: string;
}

/**
 * MNEE transaction status
 */
export interface MNEETransactionStatus {
  ticketId: string;
  status: 'BROADCASTING' | 'SUCCESS' | 'MINED' | 'FAILED';
  tx_id?: string;
  errors?: string;
}

/**
 * Wallet balance information
 */
export interface WalletBalance {
  address: string;
  atomicAmount: number;
  decimalAmount: number;
  currency: string;
}