# Updating an installed plugin

The initial package has no automatic updater. An installed copy can be revised in the CRM, and improvements to the reusable core can be committed to the plugin repository. An upstream change only reaches the CRM after a deliberate update.

## Keep the installation traceable

During first integration, record the source repository URL, exact upstream commit/tag, package version, schema version, installed module paths, host UI/auth/storage adapters, and any approved registration changes in a small installation manifest inside the plugin namespace. Record local customizations separately. Do not store credentials or financial data in the manifest.

## Update workflow

1. Inspect the installed module and its manifest before changing anything. Preserve uncommitted work. Create a dedicated change branch using the host's conventions.
2. For an upstream update, compare the installed source commit with the requested new commit. Merge relevant changes into the existing module; preserve native CRM UI, authentication, tenant scoping, persistence adapters, and local customizations. Do not overwrite the whole installed folder or reinstall sample data.
3. Keep changes within the existing plugin namespace. New edits to unrelated host files still require a separate proposed patch under the original installation boundary. Previously authorized registration does not authorize arbitrary future host rewrites.
4. Keep financial records separate from application code. Preserve audit events, IDs, idempotency keys, historical rate snapshots, and existing balances. A new default commission or reserve rate applies prospectively unless a separately authorized financial adjustment says otherwise.
5. If storage changes are required, version the schema and prepare a tested migration, compatibility plan, backup/restore procedure, and rollback strategy. Test on non-production data first. Do not reset or overwrite live records to make the new code work. A code rollback alone does not undo a data migration.
6. Run the financial regression tests plus host integration tests. Verify tenant/role permissions, payroll/HOS counted once, payment limits, cashbook balances, historical reports, and at least one existing CRM route. Compare before/after balances on a representative test dataset.
7. Update the manifest and change notes. Review the diff, then use the host's authorized deployment process. A change to the GitHub source alone is not a production deployment.

## Reusable update prompt

> Update the bookkeeping plugin already installed in this CRM to implement: DESCRIBE_CHANGE. If using an upstream release, use REPOSITORY_URL at COMMIT_OR_TAG. Read the installed integration manifest, the original INTEGRATE.md, and docs/UPDATING.md. Compare the existing implementation before editing. Preserve native CRM UI, host adapters, all financial records, audit history, and historical commission/reserve snapshots. Implement the change inside the existing plugin namespace. Provide any necessary host-file changes as an unapplied patch and any schema migration as a separately reviewable, tested change. Run financial and CRM regression checks, update the installation manifest, and report the result. Do not deploy or modify production data as part of this update.

Examples of future changes include new reports, a revised prospective rate, a bank-import connector, additional payroll fields, and new expense categories. Each should be scoped and tested according to its effect on existing records.
