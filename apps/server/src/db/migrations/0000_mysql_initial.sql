CREATE TABLE `auth_accounts` (
	`id` varchar(128) NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` varchar(128) NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` datetime,
	`refresh_token_expires_at` datetime,
	`scope` text,
	`password` text,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `auth_accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` varchar(128) NOT NULL,
	`user_id` varchar(128) NOT NULL,
	`name` text NOT NULL,
	`color` text,
	`icon_name` text NOT NULL DEFAULT ('tag'),
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `finance_accounts` (
	`id` varchar(128) NOT NULL,
	`name` varchar(255) NOT NULL,
	`currency` text NOT NULL DEFAULT ('THB'),
	`opening_balance_satang` bigint NOT NULL DEFAULT 0,
	`user_id` varchar(128) NOT NULL,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `finance_accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `finance_accounts_user_name_unique` UNIQUE(`user_id`,`name`),
	CONSTRAINT `finance_accounts_currency_thb_check` CHECK(`finance_accounts`.`currency` = 'THB')
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` varchar(128) NOT NULL,
	`expires_at` datetime NOT NULL,
	`token` varchar(255) NOT NULL,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`ip_address` text,
	`user_agent` text,
	`user_id` varchar(128) NOT NULL,
	CONSTRAINT `session_id` PRIMARY KEY(`id`),
	CONSTRAINT `session_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` varchar(128) NOT NULL,
	`user_id` varchar(128) NOT NULL,
	`source_account_id` varchar(128),
	`destination_account_id` varchar(128),
	`category_id` varchar(128),
	`amount_satang` bigint NOT NULL,
	`note` text NOT NULL,
	`transaction_date` date NOT NULL,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`),
	CONSTRAINT `transactions_positive_amount_check` CHECK(`transactions`.`amount_satang` > 0),
	CONSTRAINT `transactions_nonempty_note_check` CHECK(length(trim(`transactions`.`note`)) > 0),
	CONSTRAINT `transactions_valid_endpoints_check` CHECK((
        (`transactions`.`source_account_id` is not null and `transactions`.`destination_account_id` is null and `transactions`.`category_id` is not null)
        or (`transactions`.`source_account_id` is null and `transactions`.`destination_account_id` is not null and `transactions`.`category_id` is not null)
        or (
          `transactions`.`source_account_id` is not null
          and `transactions`.`destination_account_id` is not null
          and `transactions`.`source_account_id` <> `transactions`.`destination_account_id`
          and `transactions`.`category_id` is null
        )
      ))
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` varchar(128) NOT NULL,
	`name` text NOT NULL,
	`email` varchar(320) NOT NULL,
	`email_verified` boolean NOT NULL DEFAULT false,
	`image` text,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `user_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `verification` (
	`id` varchar(128) NOT NULL,
	`identifier` varchar(255) NOT NULL,
	`value` text NOT NULL,
	`expires_at` datetime NOT NULL,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `verification_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `auth_accounts` ADD CONSTRAINT `auth_accounts_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `categories` ADD CONSTRAINT `categories_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_accounts` ADD CONSTRAINT `finance_accounts_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `session` ADD CONSTRAINT `session_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_source_account_id_finance_accounts_id_fk` FOREIGN KEY (`source_account_id`) REFERENCES `finance_accounts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_destination_account_id_finance_accounts_id_fk` FOREIGN KEY (`destination_account_id`) REFERENCES `finance_accounts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_category_id_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `account_userId_idx` ON `auth_accounts` (`user_id`);--> statement-breakpoint
CREATE INDEX `categories_userId_idx` ON `categories` (`user_id`);--> statement-breakpoint
CREATE INDEX `finance_accounts_name_idx` ON `finance_accounts` (`name`);--> statement-breakpoint
CREATE INDEX `session_userId_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE INDEX `transactions_user_id_idx` ON `transactions` (`user_id`);--> statement-breakpoint
CREATE INDEX `transactions_source_account_id_idx` ON `transactions` (`source_account_id`);--> statement-breakpoint
CREATE INDEX `transactions_destination_account_id_idx` ON `transactions` (`destination_account_id`);--> statement-breakpoint
CREATE INDEX `transactions_category_id_idx` ON `transactions` (`category_id`);--> statement-breakpoint
CREATE INDEX `transactions_recent_idx` ON `transactions` (`user_id`,`transaction_date`,`created_at`,`id`);--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);