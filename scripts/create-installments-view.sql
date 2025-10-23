-- Vista para estados derivados de cuotas
CREATE OR REPLACE VIEW public.installments_with_status AS
SELECT
  i.*,
  (i.amount_due - COALESCE(i.amount_paid, 0)) as balance_due,
  CASE
    WHEN i.paid_at IS NOT NULL THEN
      CASE
        WHEN i.paid_at::date < i.due_date THEN 'PAGO_ANTICIPADO'
        WHEN i.paid_at::date = i.due_date THEN 'PAGADA_EN_FECHA'
        ELSE 'PAGADA_CON_MORA'
      END
    ELSE
      CASE
        WHEN timezone('America/Argentina/Cordoba', now())::date < i.due_date THEN 'A_PAGAR'
        WHEN timezone('America/Argentina/Cordoba', now())::date = i.due_date THEN 'A_PAGAR_HOY'
        ELSE 'VENCIDA'
      END
  END AS status
FROM public.installments i;

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_installments_loan_due ON installments(loan_id, due_date);
CREATE INDEX IF NOT EXISTS idx_payment_imputations_installment ON payment_imputations(installment_id);
CREATE INDEX IF NOT EXISTS idx_payment_imputations_receipt ON payment_imputations(receipt_id);
CREATE INDEX IF NOT EXISTS idx_receipts_client_date ON receipts(client_id, receipt_date);
