-- Fix: inventory trigger was UPDATE-only, so newly inserted inventory rows
-- never triggered min_price recalculation on the parent product.
-- This caused products with valid stock to show min_price = NULL on the website.

DROP TRIGGER IF EXISTS sync_min_price_inventory ON inventory;

CREATE TRIGGER sync_min_price_inventory
AFTER INSERT OR UPDATE OF quantity_on_hand, quantity_reserved
ON inventory
FOR EACH ROW
EXECUTE FUNCTION sync_min_price_on_inventory();
