export class OrderDetails {
    sessionId: string | null = null;
    paymentId: string | null = null;
    totalPrice: number | null = null;
    receiptUrl: string | null = null;
    customerName: string | null = null;
    userId: string | null = null;
    createdAt: Date | null = null;
    table: { id: string | null; name: string | null } | null = null;
    locationId: string | null = null;
    remarks: string | null = null;
    orderItems = []; 

    constructor(init?: Partial<OrderDetails>) {
        Object.assign(this, init);
    }

    isComplete(): boolean {
        // Exclude optional fields (like customerName) from the generic null-check so optional PII doesn't block completion
        const values = Object.entries(this)
            .filter(([k]) => k !== 'customerName')
            .map(([, v]) => v);
        return !values.some(value => value === null || value === undefined) && this.userId !== null && this.orderItems.length > 0;
    }

    reset(): void {
        this.paymentId = null;
        this.totalPrice = null;
        this.receiptUrl = null;
        this.customerName = null;
        this.userId = null;
        this.createdAt = null;
        this.table = null;
        this.remarks = null;
        this.orderItems = [];
    }
}
