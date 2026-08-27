CREATE TEMP TABLE `__pending_transactions_guard` (
	`pending_count` integer NOT NULL CHECK (`pending_count` = 0)
);--> statement-breakpoint
INSERT INTO `__pending_transactions_guard` (`pending_count`)
SELECT COUNT(*) FROM `transactions` WHERE `status` <> 'completed';--> statement-breakpoint
DROP TABLE `__pending_transactions_guard`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
		`source_account_id` text,
		`destination_account_id` text,
	`category_id` text,
	`type` text NOT NULL,
	`amount_satang` integer NOT NULL,
	`note` text NOT NULL,
	`date` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`source_account_id`) REFERENCES `finance_accounts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`destination_account_id`) REFERENCES `finance_accounts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_transactions`(
	"id",
	"user_id",
	"source_account_id",
	"destination_account_id",
	"category_id",
	"type",
	"amount_satang",
	"note",
	"date",
	"created_at",
	"updated_at"
)
SELECT
	"id",
	"user_id",
	CASE WHEN "type" IN ('expense', 'transfer') THEN "bank_account_id" ELSE NULL END,
	CASE WHEN "type" = 'income' THEN "bank_account_id" WHEN "type" = 'transfer' THEN "to_account_id" ELSE NULL END,
	"category_id",
	"type",
	CAST(ROUND("amount" * 100) AS INTEGER),
	"description",
	"date",
	"created_at",
	"updated_at"
FROM `transactions`;--> statement-breakpoint
DROP TABLE `transactions`;--> statement-breakpoint
ALTER TABLE `__new_transactions` RENAME TO `transactions`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `transactions_userId_idx` ON `transactions` (`user_id`);--> statement-breakpoint
CREATE INDEX `transactions_date_idx` ON `transactions` (`date`);--> statement-breakpoint
ALTER TABLE `categories` ADD `icon_name` text DEFAULT 'tag' NOT NULL;--> statement-breakpoint
ALTER TABLE `finance_accounts` ADD `opening_balance_satang` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
UPDATE `finance_accounts` SET `opening_balance_satang` = CAST(ROUND(`balance` * 100) AS INTEGER);--> statement-breakpoint
ALTER TABLE `finance_accounts` DROP COLUMN `balance`;
