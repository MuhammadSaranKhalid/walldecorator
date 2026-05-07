-- =====================================================
-- Migration: Fix send_order_confirmation_email trigger
--
-- Problem: pg_net's net.http_post takes `body jsonb`, but the trigger
-- function passed body as ::text. Calls failed with:
--   function net.http_post(url => text, headers => jsonb, body => text) does not exist
--
-- This bug was latent because the trigger only fires on UPDATE → confirmed.
-- COD orders are INSERTed directly as confirmed (no trigger fire), and there
-- were no UPDATE flows touching status. The new card flow flips status from
-- 'pending' → 'confirmed' inside mark_order_paid(), which exposed the bug
-- and left card orders stuck in pending after a successful Stripe charge.
-- =====================================================

CREATE OR REPLACE FUNCTION public.send_order_confirmation_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'vault'
AS $function$
DECLARE
  v_webhook_url TEXT;
  v_webhook_secret TEXT;
BEGIN
  -- Only trigger when status changes to 'confirmed'
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN

    SELECT decrypted_secret INTO v_webhook_url
    FROM vault.decrypted_secrets
    WHERE name = 'order_email_webhook_url'
    LIMIT 1;

    SELECT decrypted_secret INTO v_webhook_secret
    FROM vault.decrypted_secrets
    WHERE name = 'webhook_secret'
    LIMIT 1;

    IF v_webhook_url IS NULL THEN
      RAISE WARNING 'order_email_webhook_url not found in Vault. Skipping email.';
      RETURN NEW;
    END IF;

    -- pg_net.http_post expects `body jsonb` — drop the prior ::text cast.
    PERFORM net.http_post(
      url := v_webhook_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || COALESCE(v_webhook_secret, '')
      ),
      body := jsonb_build_object(
        'type', 'UPDATE',
        'table', 'orders',
        'record', jsonb_build_object(
          'id', NEW.id,
          'order_number', NEW.order_number,
          'status', NEW.status,
          'customer_email', NEW.customer_email,
          'customer_name', NEW.customer_name,
          'shipping_address', NEW.shipping_address,
          'subtotal', NEW.subtotal,
          'shipping_cost', NEW.shipping_cost,
          'tax_amount', NEW.tax_amount,
          'total_amount', NEW.total_amount,
          'created_at', NEW.created_at
        ),
        'old_record', jsonb_build_object(
          'status', OLD.status
        )
      )
    );

  END IF;

  RETURN NEW;
END;
$function$;
