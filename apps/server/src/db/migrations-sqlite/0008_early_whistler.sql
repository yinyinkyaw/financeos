PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`source_account_id` text,
	`destination_account_id` text,
	`category_id` text,
	`amount_satang` integer NOT NULL,
	`note` text NOT NULL,
	`transaction_date` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`source_account_id`) REFERENCES `finance_accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`destination_account_id`) REFERENCES `finance_accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action,
		CONSTRAINT "transactions_positive_amount_check" CHECK("amount_satang" > 0),
		CONSTRAINT "transactions_nonempty_note_check" CHECK(length(trim("note")) > 0),
		CONSTRAINT "transactions_valid_endpoints_check" CHECK((
	        ("source_account_id" is not null and "destination_account_id" is null and "category_id" is not null)
	        or ("source_account_id" is null and "destination_account_id" is not null and "category_id" is not null)
	        or (
	          "source_account_id" is not null
	          and "destination_account_id" is not null
	          and "source_account_id" <> "destination_account_id"
	          and "category_id" is null
	        )
	      ))
);
--> statement-breakpoint
INSERT INTO `__new_transactions`("id", "user_id", "source_account_id", "destination_account_id", "category_id", "amount_satang", "note", "transaction_date", "created_at", "updated_at") SELECT "id", "user_id", "source_account_id", "destination_account_id", "category_id", "amount_satang", "note", "date", "created_at", "updated_at" FROM `transactions`;--> statement-breakpoint
DROP TABLE `transactions`;--> statement-breakpoint
ALTER TABLE `__new_transactions` RENAME TO `transactions`;--> statement-breakpoint
CREATE INDEX `transactions_user_id_idx` ON `transactions` (`user_id`);--> statement-breakpoint
CREATE INDEX `transactions_source_account_id_idx` ON `transactions` (`source_account_id`);--> statement-breakpoint
CREATE INDEX `transactions_destination_account_id_idx` ON `transactions` (`destination_account_id`);--> statement-breakpoint
CREATE INDEX `transactions_category_id_idx` ON `transactions` (`category_id`);--> statement-breakpoint
CREATE INDEX `transactions_recent_idx` ON `transactions` (`user_id`,`transaction_date`,`created_at`,`id`);--> statement-breakpoint
CREATE TABLE `__new_finance_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`currency` text DEFAULT 'THB' NOT NULL,
	`opening_balance_satang` integer DEFAULT 0 NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
		CONSTRAINT "finance_accounts_currency_thb_check" CHECK("currency" = 'THB')
);
--> statement-breakpoint
INSERT INTO `__new_finance_accounts`("id", "name", "currency", "opening_balance_satang", "user_id", "created_at", "updated_at") SELECT "id", "name", 'THB', "opening_balance_satang", "user_id", "created_at", "updated_at" FROM `finance_accounts`;--> statement-breakpoint
DROP TABLE `finance_accounts`;--> statement-breakpoint
ALTER TABLE `__new_finance_accounts` RENAME TO `finance_accounts`;--> statement-breakpoint
CREATE INDEX `finance_accounts_name_idx` ON `finance_accounts` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `finance_accounts_user_name_unique` ON `finance_accounts` (`user_id`,`name`);--> statement-breakpoint
PRAGMA foreign_keys=ON;
