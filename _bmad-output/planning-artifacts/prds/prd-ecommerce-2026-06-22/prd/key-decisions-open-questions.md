# Key Decisions & Open Questions

## Decisions Made
1. **MVP scope is intentionally narrow** — focus on stability, not features
2. **Solo development** — prioritize well-architected, maintainable code over rapid feature expansion
3. **Mock payments** — test mode for safety; production payment integration in v1.1
4. **Single country** — no multi-currency or localization complexity in MVP
5. **Required registration** — simplifies checkout; guest checkout in v1.1

## Open Questions for Discussion
- [ ] **Guest checkout**: Should MVP support guest checkout, or enforce registration?
- [ ] **Product reviews**: Include basic review system, or defer to v1.1?
- [ ] **Email notifications**: Transactional emails (order confirmation, shipping) — vendor (Nodemailer, SendGrid, AWS SES)?
- [ ] **Admin UI**: Should admin dashboard be in same app (Next.js) or separate admin panel?
- [ ] **Search algorithm**: Simple text search, or Elasticsearch/Algolia for advanced search?
- [ ] **Database**: Single MySQL instance, or prepare for sharding/replication from day 1?

---
