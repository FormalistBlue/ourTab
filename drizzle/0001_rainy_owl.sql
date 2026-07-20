ALTER TABLE `preferences` ADD `theme` text DEFAULT 'mist' NOT NULL;--> statement-breakpoint
ALTER TABLE `preferences` ADD `tile_radius` integer DEFAULT 18 NOT NULL;--> statement-breakpoint
ALTER TABLE `preferences` ADD `tile_opacity` real DEFAULT 0.055 NOT NULL;--> statement-breakpoint
ALTER TABLE `preferences` ADD `grid_gap` integer DEFAULT 11 NOT NULL;--> statement-breakpoint
ALTER TABLE `preferences` ADD `hero_offset` integer DEFAULT 24 NOT NULL;