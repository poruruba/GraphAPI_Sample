'use strict';

const HELPER_BASE = process.env.HELPER_BASE || "/opt/";
const Response = require(HELPER_BASE + 'response');
const Redirect = require(HELPER_BASE + 'redirect');

const jsonfile = require(HELPER_BASE + "jsonfile-utils");
const httpUtils = require(HELPER_BASE + "http-utils");
const { Client } = require("@microsoft/microsoft-graph-client");

const TOKEN_FILE_PATH = process.env.THIS_BASE_PATH + '/data/entra/access_token.json';
const ENTRAID_API_KEY = process.env.ENTRAID_API_KEY;
const token_url_base = process.env.PUBLIC_HOST_NAME;

const client_entra = Client.initWithMiddleware({
	authProvider: {
		getAccessToken: async () => {
			return await getAccessToken("entra");
		},
	},
});

const client_microsoft = Client.initWithMiddleware({
	authProvider: {
		getAccessToken: async () => {
			return await getAccessToken("microsoft");
		},
	},
});

async function getAccessToken(tenant)
{
	var json = await jsonfile.read_json(TOKEN_FILE_PATH, {});
	var token;
	if( tenant == 'entra')
		token = json['entra'];
	else
		token = json['microsoft'];

	if( (token.created_at + token.expires_in * 1000 - 3 * 60 * 1000) < new Date().getTime() ){
		var input = {
			url: token_url_base + "/entra/token-refresh",
			body: {
				tenant: tenant
			},
			api_key: ENTRAID_API_KEY
		};
		var result = await httpUtils.do_http(input);
		console.log(result);

		json = await jsonfile.read_json(TOKEN_FILE_PATH);
		if( tenant == 'entra')
			token = json['entra'];
		else
			token = json['microsoft'];
	}

	return token.access_token;
}

exports.handler = async (event, context, callback) => {
	var body = JSON.parse(event.body);
	console.log(body);

  if( event.requestContext.apikeyAuth?.apikey != ENTRAID_API_KEY )
    throw Error("invalid apikey");

	var client = (body.tenant == 'entra') ? client_entra : client_microsoft;

	if( event.path == "/graph-call" ){
		var result;
		if( body.method == 'get'){
			result = await client.api(body.param).get();
			console.log(result);
		}else
		if( body.method == 'post'){
			result = await client.api(body.param).post(body.body);
			console.log(result);
		}else
		if( body.method == 'update'){
			result = await client.api(body.param).update(body.body);
			console.log(result);
		}else
		if( body.method == 'delete'){
			result = await client.api(body.param).delete(body.body);
			console.log(result);
		}else
		{
			throw new Error('invalid method');
		}

		return new Response(result);
	}else

	{
		throw new Error("unknown endpoint");
	}
	
};
