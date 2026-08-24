CREATE INDEX `finance_accounts_name_idx` ON `finance_accounts` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `finance_accounts_user_account_idex` ON `finance_accounts` (`user_id`,`name`);