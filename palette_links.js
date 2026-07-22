// Curated destinations for the command palette. Edit the tables inside the
// IIFE; the generators expand them into flat { title, keywords, url } entries.
// Search matches against title + keywords.
//
// NOTE: this file runs on every page and shares the extension's isolated world
// with the other content scripts, so it exposes exactly ONE global
// (PALETTE_ENTRIES) and keeps everything else inside the IIFE.
var PALETTE_ENTRIES = (() => {

    // ---- GCP: (domain x env) projects x services ---------------------------
    // One entry per domain; each has its own env -> projectId map (envs may
    // differ per domain). Add a domain by adding a row; add an env by adding a
    // key. Search e.g. "cloudrun aix uat", "data logs prod", "app buckets dev".
    // `extra` adds domain-specific service entries (same shape as GCP_SERVICES)
    // on top of the shared list — e.g. the Cloud Run view you care about per domain.
    const CR_JOBS = { name: 'Cloud Run Jobs', kw: 'cloudrun run jobs scheduled batch', url: 'https://console.cloud.google.com/run/jobs?project={p}' };
    const CR_SERVICES = { name: 'Cloud Run Services', kw: 'cloudrun run services', url: 'https://console.cloud.google.com/run?project={p}' };
    const GCP_PROJECTS = [
        { domain: 'data', envs: { dev: 'cbx-bsp-dev-data-ig7m', uat: 'cbx-bsp-uat-data-a4ak', prd: 'cbx-bsp-prd-data-oofa' }, extra: [CR_JOBS] },
        { domain: 'app',  envs: { dev: 'cbx-bsp-dev-ig7m',  sit: 'cbx-bsp-sit-r7rc',  uat: 'cbx-bsp-uat-a4ak',  prd: 'cbx-bsp-prd-oofa' } },
        { domain: 'aix',  envs: { dev: 'cbx-aix-dev-zryo', sit: 'cbx-aix-sit-qx1v', prd: 'cbx-aix-prd-iwit' }, extra: [CR_SERVICES] },
        // { domain: 'ccai', envs: { dev: 'cbx-aix-ccai-dev-zryo', uat: 'cbx-aix-ccai-uat-h6rr', prd: 'cbx-aix-ccai-prd-iwit' } },
    ];
    // Extra search words per env, so "prod" finds "prd", etc.
    const ENV_KW = { dev: 'dev development', sit: 'sit', uat: 'uat', pre: 'pre preprod pre-production', prd: 'prd prod production' };
    const GCP_SERVICES = [
        { name: 'Cloud Run',         kw: 'cloudrun run services',            url: 'https://console.cloud.google.com/run?project={p}' },
        { name: 'Cloud Storage',     kw: 'gcs buckets storage',              url: 'https://console.cloud.google.com/storage/browser?project={p}' },
        { name: 'Artifact Registry', kw: 'artifacts registry docker images', url: 'https://console.cloud.google.com/artifacts?project={p}' },
        { name: 'Logs Explorer',     kw: 'logging logs query',               url: 'https://console.cloud.google.com/logs/query?project={p}' },
        { name: 'Pub/Sub',           kw: 'pubsub topics subscriptions',      url: 'https://console.cloud.google.com/cloudpubsub/topic/list?project={p}' },
        { name: 'BigQuery',          kw: 'bq datasets sql warehouse',        url: 'https://console.cloud.google.com/bigquery?project={p}' },
        { name: 'IAM',               kw: 'iam permissions roles sa',         url: 'https://console.cloud.google.com/iam-admin/iam?project={p}' },
        { name: 'Secret Manager',    kw: 'secrets credentials',              url: 'https://console.cloud.google.com/security/secret-manager?project={p}' },
        { name: 'Cloud SQL',         kw: 'sql database postgres instances',  url: 'https://console.cloud.google.com/sql/instances?project={p}' },
        { name: 'Monitoring',        kw: 'metrics dashboards alerts',        url: 'https://console.cloud.google.com/monitoring?project={p}' },
        { name: 'Load Balancing',    kw: 'load balancer lb network services', url: 'https://console.cloud.google.com/net-services/loadbalancing/list/loadBalancers?project={p}' },
    ];
    const gcp = GCP_PROJECTS.flatMap(({ domain, envs, extra = [] }) =>
        Object.entries(envs).flatMap(([env, projectId]) =>
            [...GCP_SERVICES, ...extra].map(s => ({
                title: `GCP ${domain} ${s.name} (${env})`,
                keywords: `gcp ${domain} ${env} ${ENV_KW[env] || ''} ${s.kw} ${projectId}`,
                url: s.url.replace('{p}', projectId),
            }))));

    // Shared / cross-env GCP projects that don't follow the domain x env model
    // (infra shared between envs to save cost). List only the services each one
    // actually exposes, by their GCP_SERVICES `name`.
    const GCP_SHARED = [
        { label: 'ssv', kw: 'shared ssv npd non-prod infra', projectId: 'cbx-bsp-ssv-gn3m', services: ['Artifact Registry'] },
    ];
    const gcpShared = GCP_SHARED.flatMap(({ label, kw, projectId, services }) =>
        services.map(name => {
            const s = GCP_SERVICES.find(x => x.name === name);
            return {
                title: `GCP ${label} ${s.name}`,
                keywords: `gcp ${label} ${kw} ${s.kw} ${projectId}`,
                url: s.url.replace('{p}', projectId),
            };
        }));

    // ---- GitLab: (group x repos) x subpages ---------------------------------
    const GITLAB_GROUPS = [
        { group: 'cynergybank/data-and-analytics/ingestion-pipelines', repos: ['alloydb-historydb-alembic', 'api-raw-to-gcs-raw', 'app-alloydb-to-bq', 'app-metrics-api-to-bq', 'bottomline-reporting', 'bq-data-masking', 'bq-dbt-transforms', 'bq-reporting-to-gcs-reporting', 'companies-house-address-validator', 'db-raw-to-gcs-raw', 'de-alation_lineage', 'de-salesforce', 'dwh-schema-generator', 'external-bucket-to-gcs', 'ftp_onprem_to_gcs', 'gcs-raw-to-gcs-staging', 'gcs-reporting-to-api-reporting', 'gcs-reporting-to-sftp', 'gcs-stage-to-bq-stage', 'gcs-to-external-bucket', 'pipeline-orchestrator', 'pyspark-gcs-to-bq', 'python-shared-library', 'review-sentiment-classifier', 'salesforce-to-gcs', 'scheduled-job-executor', 'schema-validation', 'sftp-onprem-to-gcs'] },
        { group: 'cynergybank/data-and-analytics/deployment/platform', repos: ['cbx-dat-alert-policy', 'cbx-dat-bigquery-connection', 'cbx-dat-bigquery-data-transfer-config', 'cbx-dat-bigquery-datapolicy', 'cbx-dat-bigquery-dataset', 'cbx-dat-cloud-bucket', 'cbx-dat-cloud-scheduler', 'cbx-dat-cloudrun-v2', 'cbx-dat-dataform', 'cbx-dat-dataplex', 'cbx-dat-dataplex-scans', 'cbx-dat-eventarc', 'cbx-dat-pubsub', 'cbx-dat-pubsub-schema', 'cbx-dat-service-accounts', 'cbx-dat-shared-secrets', 'cbx-dat-ssv-alloy-db', 'cbx-dat-ssv-alloydb-proxy', 'cbx-dat-ssv-artifact-repositories'] },
        { group: 'cynergybank/fusion-reboot-poc/backend', 
            repos: [
                'accounting-connection-api', 'accounts-api', 'activity-tracker-api', 'affiliation-api', 'ai-insights-api', 'aime-console', 'api-qa-stack-pipeline', 'application-referral-api', 'applications-api', 'approvals-api', 'attestation-dashboard', 'auth-api', 'auth-consumer', 'boardroom-minutes-api', 'boardroom-minutes-frontend', 'card-management-proxy', 
                'cards-cheques-api', 'case-file-api', 'cash-balances-poc', 'cashflow-api', 'chainlit-poc', 'ci-templates', 'cifas-adapter-api', 'common-library', 'companies-house-connector', 'compliance-check-project', 'compliance-scanning-ai', 'contentful-exporter', 'contract-api', 'contracts', 'credit-memo-contracts', 'credit-memo-cqc-importer', 'credit-memo-cqc-scotland-importer', 
                'credit-memo-customer-case-api', 'credit-memo-epc-scotland-importer', 'credit-memo-helpers-api', 'credit-memo-integrations-api', 'currency-service', 'customer-account-query-api', 'customer-api', 'customer-authentication-gateway', 'customer-communications-gateway', 'customer-consumer', 'customer-devices-api', 'customer-feedback-importer', 'customer-onboarding-api', 'customer-onboarding-consumer', 
                'customer-orchestration-api', 'customer-preferences-api', 'customer-workflows-api', 'customer-workflows-consumer', 'dashboards-api', 'dast-scanner', 'digital-channels-console', 'digital-exp-metrics-dashboard', 'document-api', 'document-orchestration-api', 'equifax-connector', 'faq-assistant-api', 'faq-assistant-console', 'faq-sop-assistant-api', 'feature-flags-api', 'file-mapper', 'file-scan-api', 
                'fraud-review-service', 'gatekeeper-api', 'google-adapter', 'google-adapter-consumer', 'hcl-api', 'hcl-consumer', 'helper-service', 'hr-chatbot-api', 'insight-agent-delete', 'jira-tracking', 'jumio-connector', 'locations-api', 'maturities-api', 'microsoft-graph-adapter', 'mocksms-api', 'mq-services', 'neteller-service', 'notification-consumer', 'notification-legacy-consumer', 'notification-preferences-api', 
                'notification-preferences-legacy-api', 'notification-receiver-api', 'notification-sender-api', 'notification-service', 'ntb-applications-api', 'ntb-dashboard', 'open-banking-accounts-api', 'open-banking-api', 'open-banking-consents-api', 'originations-api', 'p1-p2-roto', 'payee-api', 'payments-api', 'payments-management-api', 'product-eligibilities-api', 'products-api', 'promon-dashboard', 'promon-insight-agent', 
                'python-backend-service-template', 'relationship-api', 'relationship-manager-api', 'relationship-manager-consumer', 'release-note-generator', 'review-sentiment-classifier', 'salesforce-ncino-bridge', 'salesforce-pubsub-api', 'scheduler-service', 'secure-messages-api', 'secure-messages-consumer', 'statements-api', 'strata', 'testing-api', 'timesheet-new', 'tools', 'ui-audit-api', 'user-journeys-api', 'web-vtt-helper-api', 
                'webchat-api', 'whats-new-api'] },
        { group: 'cynergybank/fusion-reboot-poc/deployment/platform/aix', repos: ['cbx-aix-bigquery-connection', 'cbx-aix-businessljtoolbox', 'cbx-aix-cloud-bucket', 'cbx-aix-cloud-scheduler', 'cbx-aix-cloudrun-v2', 'cbx-aix-cymon-internal-datastore-sync', 'cbx-aix-global-ingress', 'cbx-aix-ljtoolbox', 'cbx-aix-secrets', 'cbx-aix-service-accounts'] },
        { group: 'cynergybank/fusion-reboot-poc/deployment/backend', repos: ['cbx-bsp-deployment-npd', 'cbx-bsp-deployment-prd'] },
    ];
    const GITLAB_SUBPAGES = [
        { name: 'Repo',           kw: 'code repository home',  path: '' },
        { name: 'Pipelines',      kw: 'ci pipelines builds',   path: '/-/pipelines' },
        { name: 'Merge Requests', kw: 'mr mrs merge requests', path: '/-/merge_requests' },
        { name: 'Branches',       kw: 'branches',              path: '/-/branches' },
        { name: 'Tags',           kw: 'tags releases versions', path: '/-/tags' },
    ];
    const gitlab = GITLAB_GROUPS.flatMap(({ group, repos }) =>
        repos.flatMap(repo => GITLAB_SUBPAGES.map(p => ({
            title: `${repo} ${p.name}`,
            keywords: `gitlab ${group} ${repo} ${p.kw}`,
            url: `https://gitlab.com/${group}/${repo}${p.path}`,
        }))));

    // ---- Flat lists ---------------------------------------------------------
    const JIRA_LINKS = [
        { title: 'Jira Board — Data Platform', keywords: 'jira board sprint kanban data platform', url: 'https://obnewchannel.atlassian.net/jira/software/c/projects/TAC/boards/2044' },
        { title: 'Jira Board — Platform Ops', keywords: 'jira board sprint kanban platform ops', url: 'https://obnewchannel.atlassian.net/jira/software/projects/PO/boards/93' },
    ];
    const CONFLUENCE_LINKS = [
        // TODO: real spaces/pages
        { title: 'Confluence — Team Space', keywords: 'confluence wiki docs', url: 'https://obnewchannel.atlassian.net/wiki/spaces/XXX' },
    ];
    const MISC_LINKS = [
        // chrome:// URLs only open via Enter (new tab through the background
        // service worker); Cmd+Enter (location.href) cannot navigate to them.
        { title: 'Extension keyboard shortcuts', keywords: 'chrome rebind keys settings', url: 'chrome://extensions/shortcuts' },
        { title: 'ArgoCD (NPD)', keywords: 'argocd', url: 'https://argocd.ssv.npd.int.cynergyconnect.co.uk' },
        // Group landing page only — deliberately not expanded into its repos.
        { title: 'GitLab — Terraform Modules', keywords: 'gitlab terraform modules platform fusion-reboot-poc group', url: 'https://gitlab.com/cynergybank/fusion-reboot-poc/platform/terraform-modules' },
        { title: 'Extensions', keywords: 'chrome extensions', url: 'chrome://extensions/' },
    ];

    // Action entries trigger a command in the background service worker instead
    // of opening a URL (they carry `action` instead of `url`). `hint` is shown
    // in place of the URL line.
    const ACTIONS = [
        { title: 'Reload Browser Tools extension', keywords: 'reload restart extension browser tools dev refresh', action: 'reload-extension', hint: 'runs chrome.runtime.reload()' },
    ];

    return [...gcp, ...gcpShared, ...gitlab, ...JIRA_LINKS, ...CONFLUENCE_LINKS, ...MISC_LINKS, ...ACTIONS];
})();
