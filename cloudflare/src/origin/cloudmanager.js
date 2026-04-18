/*
 * Copyright 2022 Adobe. All rights reserved.
 * Fetches AEM Cloud Service programs from Cloud Manager API for the AEM instance selector.
 * Requires OAuth Server-to-Server credentials (CLOUDMANAGER_* secrets).
 */

const PROGRAMS_REL = 'http://ns.adobe.com/adobecloud/rel/programs';
const CM_BASE = 'https://cloudmanager.adobe.io';
const IMS_TOKEN_URL = 'https://ims-na1.adobelogin.com/ims/token/v3';

async function getCloudManagerToken(request, env) {
  const cacheKey = 'cm-ims-token';
  const { value: token, metadata } = await env.AUTH_TOKENS.getWithMetadata(cacheKey);
  const now = Math.floor(Date.now() / 1000);
  if (token && metadata?.expiration && metadata.expiration > now + 5 * 60) {
    return token;
  }
  const clientId = await env.CLOUDMANAGER_CLIENT_ID.get();
  const clientSecret = await env.CLOUDMANAGER_CLIENT_SECRET.get();
  const scope = (await env.CLOUDMANAGER_SCOPE?.get?.()) || 'https://cloudmanager.adobe.io/sdk';
  const response = await fetch(IMS_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': request.headers.get('user-agent') || 'awesomeportal-worker',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      scope,
    }),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Cloud Manager IMS token failed: ${response.status} ${text}`);
  }
  const data = await response.json();
  if (!data.access_token || !data.expires_in) {
    throw new Error(`Cloud Manager IMS token invalid: ${JSON.stringify(data)}`);
  }
  const expiration = now + data.expires_in;
  await env.AUTH_TOKENS.put(cacheKey, data.access_token, {
    expiration,
    metadata: { expiration },
  });
  return data.access_token;
}

async function getApiKeyAndOrgId(env) {
  const apiKey = await env.CLOUDMANAGER_CLIENT_ID.get();
  const orgId = await env.CLOUDMANAGER_IMS_ORG_ID.get();
  return { apiKey, orgId };
}

export async function listAemPrograms(request, env) {
  const userToken = request.headers.get('Authorization');
  const userOrg = request.headers.get('x-user-ims-org');
  const clientApiKey = request.headers.get('x-api-key');

  let accessToken;
  let orgId;
  let apiKey;

  if (userToken && userOrg && clientApiKey) {
    accessToken = userToken.startsWith('Bearer ') ? userToken : `Bearer ${userToken}`;
    orgId = userOrg.trim();
    apiKey = clientApiKey.trim();
  }

  if (!accessToken || !orgId || !apiKey) {
    try {
      accessToken = await getCloudManagerToken(request, env);
      const creds = await getApiKeyAndOrgId(env);
      apiKey = creds.apiKey;
      orgId = creds.orgId;
    } catch (e) {
      console.error('Cloud Manager credentials error', e);
      return new Response(
        JSON.stringify({ error: 'Server configuration error', programs: [] }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  const headers = {
    'x-api-key': apiKey,
    'x-gw-ims-org-id': orgId,
    'Authorization': accessToken,
    'Accept': 'application/json',
    'User-Agent': request.headers.get('user-agent') || 'awesomeportal-worker',
  };

  const tenantsRes = await fetch(`${CM_BASE}/api/tenants`, { headers });
  if (!tenantsRes.ok) {
    const text = await tenantsRes.text();
    console.error('Cloud Manager tenants error', tenantsRes.status, text);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch tenants', detail: tenantsRes.status }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    );
  }
  const tenantsData = await tenantsRes.json();

  let programsHref = null;
  const embedded = tenantsData._embedded || {};
  const tenant = embedded.tenants?.[0] ?? embedded.tenant ?? tenantsData;
  const links = tenant._links || tenantsData._links || {};
  programsHref = links[PROGRAMS_REL]?.href;
  if (!programsHref) {
    return new Response(
      JSON.stringify({ error: 'No programs link in tenants response', programs: [] }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
  const programsUrl = programsHref.startsWith('http') ? programsHref : `${CM_BASE}${programsHref.startsWith('/') ? '' : '/'}${programsHref}`;
  const programsRes = await fetch(programsUrl, { headers });
  if (!programsRes.ok) {
    const text = await programsRes.text();
    console.error('Cloud Manager programs error', programsRes.status, text);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch programs', detail: programsRes.status }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    );
  }
  const programsData = await programsRes.json();
  const embeddedPrograms = programsData._embedded?.programs || [];
  const programs = embeddedPrograms
    .filter((p) => p.type === 'aem_cloud_service' && (p.status === 'ready' || p.status === 'creating'))
    .map((p) => ({
      id: p.id,
      name: p.name,
      tenantId: p.tenantId,
      imsOrgId: p.imsOrgId,
      status: p.status,
      type: p.type,
    }));

  return new Response(JSON.stringify({ programs }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
