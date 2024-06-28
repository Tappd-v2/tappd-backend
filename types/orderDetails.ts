export class OrderDetails {
    sessionId: string | null = null;
    paymentId: string | null = null;
    totalPrice: number | null = null;
    receiptUrl: string | null = null;
    userId: string | null = null;
    createdAt: Date | null = null;
    tableId: string | null = null;
    remarks: string | null = null;
    orderItems = []; 

    constructor(init?: Partial<OrderDetails>) {
        Object.assign(this, init);
    }

    isComplete(): boolean {
        return !Object.values(this).some(value => value === null || value === undefined) && this.userId !== null && this.orderItems.length > 0;
    }

    reset(): void {
        this.paymentId = null;
        this.totalPrice = null;
        this.receiptUrl = null;
        this.userId = null;
        this.createdAt = null;
        this.tableId = null;
        this.remarks = null;
        this.orderItems = [];
    }
}
