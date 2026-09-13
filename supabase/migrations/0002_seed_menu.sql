-- Foundry Artisan Coffee — complete menu seed from in-store menu board
-- Categories: hot_coffee, hot_drinks, tea, iced_coffee, sweet_tooth, shakes_frappes, breakfast, toasties, specials, spreads

insert into public.menu_items (name, category, description, price_single, price_small, price_medium, price_large, is_available, is_special, display_order)
values
  -- HOT COFFEE
  ('Latte', 'hot_coffee', null, null, 6.00, 6.80, 7.80, true, false, 1),
  ('Flat White', 'hot_coffee', null, null, 6.00, 6.80, 7.80, true, false, 2),
  ('Cappuccino', 'hot_coffee', null, null, 6.00, 6.80, 7.80, true, false, 3),
  ('Mocha', 'hot_coffee', null, null, 6.50, 7.50, 8.00, true, false, 4),
  ('Dirty Chai', 'hot_coffee', null, null, 6.50, 7.50, 8.00, true, false, 5),
  ('Long Black', 'hot_coffee', null, null, 5.80, 6.80, 7.80, true, false, 6),
  ('Short Macchiato', 'hot_coffee', null, 5.00, null, null, null, true, false, 7),
  ('Long Macchiato', 'hot_coffee', null, 5.50, null, null, null, true, false, 8),
  ('Espresso', 'hot_coffee', null, 4.80, null, null, null, true, false, 9),
  ('Doppio', 'hot_coffee', null, 5.00, null, null, null, true, false, 10),
  ('Piccolo', 'hot_coffee', null, 5.00, null, null, null, true, false, 11),

  -- HOT DRINKS
  ('Hot Chocolate', 'hot_drinks', null, null, 6.50, 7.00, 7.80, true, false, 1),
  ('Matcha Latte', 'hot_drinks', null, null, null, 8.00, 9.00, true, false, 2),
  ('Babycino', 'hot_drinks', null, 3.00, null, null, null, true, false, 3),

  -- TEA LOVERS
  ('English Breakfast', 'tea', null, 6.50, null, null, null, true, false, 1),
  ('Earl Grey', 'tea', null, 6.50, null, null, null, true, false, 2),
  ('London Fog', 'tea', null, 6.50, null, null, null, true, false, 3),
  ('Green Sencha', 'tea', null, 6.50, null, null, null, true, false, 4),
  ('Lemongrass and Ginger', 'tea', null, 6.50, null, null, null, true, false, 5),
  ('Peppermint', 'tea', null, 6.50, null, null, null, true, false, 6),
  ('Wet Masala Chai', 'tea', null, 8.50, null, null, null, true, false, 7),

  -- ICED COFFEE
  ('Iced Latte', 'iced_coffee', null, null, null, 6.80, 7.80, true, false, 1),
  ('Iced Long Black', 'iced_coffee', null, null, null, 6.80, 7.80, true, false, 2),
  ('Vietnamese Iced Coffee', 'iced_coffee', null, null, null, 8.50, 9.50, true, false, 3),
  ('Iced Mocha', 'iced_coffee', null, null, null, 7.50, 8.50, true, false, 4),
  ('Iced Dirty Chai', 'iced_coffee', null, null, null, 7.50, 8.50, true, false, 5),
  ('Cold Brew', 'iced_coffee', null, null, null, 7.50, 8.50, true, false, 6),
  ('Affogato', 'iced_coffee', null, 6.50, null, null, null, true, false, 7),

  -- SWEET TOOTH
  ('Iced Chai Latte', 'sweet_tooth', null, null, null, 6.80, 7.80, true, false, 1),
  ('Iced Choc Chai', 'sweet_tooth', null, null, null, 7.50, 8.50, true, false, 2),
  ('Iced Chocolate', 'sweet_tooth', null, null, null, 6.80, 7.80, true, false, 3),
  ('Iced Matcha', 'sweet_tooth', 'Add strawberry or mango +$1', null, null, 8.50, 9.50, true, false, 4),
  ('Iced Tea', 'sweet_tooth', 'Mango magic, tropical kiss, sneaky peach', 8.50, null, null, null, true, false, 5),
  ('Cool Kids Chocolate Milk', 'sweet_tooth', null, 3.50, null, null, null, true, false, 6),

  -- SHAKES AND FRAPPES
  ('Coffee Frappe', 'shakes_frappes', null, 10.50, null, null, null, true, false, 1),
  ('Flavoured Frappe', 'shakes_frappes', 'Caramel / Vanilla / Chocolate / Strawberry', 9.50, null, null, null, true, false, 2),
  ('Coffee Shake', 'shakes_frappes', null, 9.50, null, null, null, true, false, 3),
  ('Flavoured Shake', 'shakes_frappes', 'Caramel / Vanilla / Chocolate / Strawberry', 8.50, null, null, null, true, false, 4),

  -- CLASSIC BREAKFASTS
  ('Bacon and Egg Bagel', 'breakfast', '2 fried eggs, bacon, spinach, onion, tomato, aioli and BBQ sauce on a bagel. Swap toast for a bagel +$1', 20.90, null, null, null, true, false, 1),
  ('Eggs Benny', 'breakfast', '2 poached eggs, Foundry hollandaise, spinach and tomato with choice of protein (bacon/ham, salmon +$2)', 22.50, null, null, null, true, false, 2),
  ('Eggs Your Way', 'breakfast', 'Tomato, spinach and eggs your way on white toast. Fried / poached (scrambled +$2)', 15.50, null, null, null, true, false, 3),
  ('Kids Brekkie', 'breakfast', 'Bacon, spinach and a fried egg served on 1 white toast', 9.90, null, null, null, true, false, 4),

  -- TOASTIES
  ('Bacon Toastie', 'toasties', 'Bacon, cheese, spinach, BBQ sauce and fried egg', 16.90, null, null, null, true, false, 1),
  ('Ham and Cheese Toastie', 'toasties', 'Smoked ham and melted cheddar cheese on toasted bread', 14.90, null, null, null, true, false, 2),
  ('Cheese Toastie', 'toasties', 'Classic melted cheddar cheese on toasted bread', 9.90, null, null, null, true, false, 3),

  -- FOUNDRY SPECIALS
  ('Feta Salad', 'specials', '250g smashed avocado, fresh cut tomato, feta, lemon and 2 poached eggs', 16.50, null, null, null, true, true, 1),
  ('Smashed Avo and Feta on Toast', 'specials', 'Smashed avocado, feta, tomato and lemon served on white toast', 17.90, null, null, null, true, true, 2),
  ('Pesto and Fried Eggs', 'specials', '2 fried eggs served with pesto and spinach on white toast', 15.50, null, null, null, true, true, 3),
  ('Smoked Salmon and Avo', 'specials', 'Smashed avocado, smoked salmon, spinach and lemon on white toast', 21.90, null, null, null, true, true, 4),
  ('Salmon, Cream Cheese and Capers', 'specials', 'Cream cheese, smoked salmon, capers and lemon on white toast', 22.90, null, null, null, true, true, 5),
  ('Hummus, Feta and Sundried Tomato', 'specials', '(Surprisingly) hummus, feta and sundried tomato on white toast', 15.50, null, null, null, true, true, 6),

  -- SPREADS
  ('Cream Cheese', 'spreads', 'Served on white toast. Add strawberry, blackberry, marmalade or apricot jam! +$1', 9.90, null, null, null, true, false, 1),
  ('Nutella', 'spreads', 'Nutella on white toast', 8.90, null, null, null, true, false, 2),
  ('Peanut Butter', 'spreads', 'Peanut butter on white toast', 8.90, null, null, null, true, false, 3),
  ('Butter and Honey', 'spreads', 'Butter and honey on white toast', 9.50, null, null, null, true, false, 4),
  ('Butter and Vegemite', 'spreads', 'Butter and Vegemite on white toast', 9.50, null, null, null, true, false, 5),
  ('Butter and Jam', 'spreads', 'Strawberry, blackberry, marmalade or apricot jam with butter on white toast', 8.90, null, null, null, true, false, 6),
  ('Just Butter', 'spreads', 'White toast served with butter', 8.90, null, null, null, true, false, 7);
