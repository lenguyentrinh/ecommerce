# Assumptions & Constraints

## Payment & Billing
- **Mock payment in MVP**: Use Stripe test mode or mock payment endpoint; no real money processing
- **Refund logic**: Deferred to v1.1; MVP documents refund intent but does not process refunds
- **Tax calculation**: Hardcoded flat tax rate (e.g., 10%) or no tax in MVP; detailed tax logic deferred

## Shipping
- **Shipping calculation**: Flat shipping fee (e.g., $5 USD) for all orders; no carrier integration in MVP
- **Estimated delivery**: Hardcoded estimate (e.g., 3–5 business days); no real tracking integration
- **Geographic scope**: Single country (USA or target region); no multi-currency or localization

## Inventory
- **Stock deduction**: Stock decremented upon order confirmation (not during checkout)
- **Out of stock**: Products cannot be purchased if stock = 0; item remains listed but disabled
- **Stock sync**: Inventory updated in real-time; no batch processing delays

## User Accounts
- **Registration**: Required for checkout (no true guest checkout in MVP; encourage registration)
- **Account verification**: Email OTP or link verification required
- **Password reset**: Basic flow; no time-limited tokens in MVP (or simple expiry)
- **Address book**: Users can save up to 1–2 addresses initially; bulk management deferred

## Analytics & Data
- **Event tracking**: Basic logging only; no complex funnel analysis in MVP
- **User data retention**: No explicit data deletion in MVP; compliance/GDPR deferred to v1.1
- **Session management**: Simple session timeout; no advanced activity tracking

## Admin Features
- **User roles**: Admin role only in MVP (no multiple permission levels)
- **Audit trail**: Order status changes logged; full action audit deferred
- **Bulk operations**: No bulk product or order actions in MVP

## Performance & Scale
- **Concurrent user target**: 100–500 users; no horizontal scaling in MVP (single server deployment)
- **Database**: Single instance MySQL; no replication or failover in MVP
- **Caching**: Basic cache for product catalog; no advanced caching strategy (CDN, Redis, etc.)

---
