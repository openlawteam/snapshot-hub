# snapshot-hub

### Running

> \$ docker-compose up --build

### API

#### Create Proposal

Required Attributes

- **body**: `address`, `msg`, `sig`
- **msg**: `payload`, `timestamp`, `token`, `space`, `type`, `actionId`, `version`, `chainId`, `verifyingContract`, `spaceHash`
- **payload**: `name`, `body`, `choices`, `start`, `end`, `snapshot`, `metadata`, `nameHash`, `bodyHash`

Request

```
POST {{baseUrl}}/api/message HTTP/1.1
Content-Type: application/json
```

```json
{
  "address": "0xEd7B3f2902f2E1B17B027bD0c125B674d293bDA0",
  "msg": "{\"payload\":{\"name\":\"Test\",\"body\":\"Test\",\"choices\":[\"Yes\",\"No\"],\"start\":\"1610473245\",\"end\":\"1610476845\",\"snapshot\":1,\"metadata\":{\"private\":0,\"type\":\"governance\",\"subType\":\"governance\"},\"nameHash\":\"0x85cc825a98ec217d960f113f5f80a95d7fd18e3725d37df428eb14f880bdfc12\",\"bodyHash\":\"0x85cc825a98ec217d960f113f5f80a95d7fd18e3725d37df428eb14f880bdfc12\"},\"timestamp\":\"1610473245\",\"token\":\"0x8f56682a50becb1df2fb8136954f2062871bc7fc\",\"space\":\"thelao\",\"type\":\"proposal\",\"actionId\":\"0x4539Bac77398aF6d582842F174464b29cf3887ce\",\"version\":\"0.2.0\",\"chainId\":1337,\"verifyingContract\":\"0xcFc2206eAbFDc5f3d9e7fA54f855A8C15D196c05\",\"spaceHash\":\"0x4b06809c3104de1eaf356c04efd4fa3b56d67554fcf451d978fc02826c2d43ce\"}",
  "sig": "0x1eeed4339765643d53fd03a356fcc7d571e593d5ad29d99028e7d3b39bbd3944078b0c1f02cea8aa95c4a0c57b916eec10b61f913242515810f98db6d61a347c1b"
}
```

Response

```json
{
  "ipfsHash": "QmPki7TQRz74en9hpkLMNwpvkdjxxKSWciXEiMs5seFodN"
}
```

#### Voting

Required Attributes

- **body**: `address`, `msg`, `sig`
- **msg**: `payload`, `timestamp`, `token`, `space`, `type`, `actionId`, `version`, `chainId`, `verifyingContract`, `spaceHash`
- **payload**: `choice`, `proposalIpfsHash`, `metadata`

Request

```
POST {{baseUrl}}/api/message HTTP/1.1
Content-Type: application/json
```

```json
{
  "address": "0xEd7B3f2902f2E1B17B027bD0c125B674d293bDA0",
  "msg": "{\"payload\":{\"choice\":\"no\",\"proposalIpfsHash\":\"QmVKAT3WmVtMWZmc4ag6PyG3X44D9vAgWE8LTeg54oJG8z\",\"metadata\":{\"memberAddress\":\"0xEd7B3f2902f2E1B17B027bD0c125B674d293bDA0\"}},\"timestamp\":\"1610383779\",\"token\":\"0x8f56682a50becb1df2fb8136954f2062871bc7fc\",\"space\":\"test-space\",\"type\":\"vote\",\"version\":\"0.2.0\",\"actionId\":\"0x4539Bac77398aF6d582842F174464b29cf3887ce\",\"chainId\":1337,\"verifyingContract\":\"0xcFc2206eAbFDc5f3d9e7fA54f855A8C15D196c05\",\"spaceHash\":\"0x43728127e62962888e5037562ea09ff02e1533a40a9d70b2d8069e5df847306b\"}",
  "sig": "0x60909a5894ae2f33c01a5441948e32a687b66d5b1d2ebd27bb4f6d8a13a98e9d2ca319e25d508cbd4bf51cbf2ea4145e6f74f6839ecaaeedae44daae62a8335f1b"
}
```

Response

```json
{
  "ipfsHash": "QmX4qettVJbMHbGxwJpeGowBWK2w2Y6GtB7TZpS7xhdREE"
}
```

#### Get All Proposals

Request

```
GET {{baseUrl}}/api/:space/proposals HTTP/1.1
```

Response

```
{
	"QmdWFWZZfz4GdZNHC1mqpAbjkr7DpNfZFeiZT4H7qDWk3x": {
		"address": "0xEd7B3f2902f2E1B17B027bD0c125B674d293bDA0",
		"msg": {
			"version": "0.2.0",
			"timestamp": "1610395170",
			"token": "0x8f56682a50becb1df2fb8136954f2062871bc7fc",
			"type": "proposal",
			"payload": {
				"name": "Teste",
				"body": "teste",
				"choices": ["Yes", "No"],
				"start": "1610395170",
				"end": "1610398770",
				"snapshot": 1,
				"metadata": {
					"private": 0,
					"type": "governance",
					"subType": "governance"
				},
				"nameHash": "0x9dc74d25d444fb1b1a41350e18236f9f3b75fda9cdf2bfed70ac7e87aa3c5c07",
				"bodyHash": "0xe0d4f6e915eb01068ecd79ce922236bf16c38b2d88cccffcbc57ed53ef3b74aa"
			}
		},
		"sig": "0x1f766480eb824a314a8a3352d608a9af9a9730e020b949a9b827d0a785c5140d1c780fa9c153562f22e0c56ff822f132b585548dc824f37db05aeb5f8a3f1a991b",
		"authorIpfsHash": "QmdWFWZZfz4GdZNHC1mqpAbjkr7DpNfZFeiZT4H7qDWk3x",
		"relayerIpfsHash": "Qmctq4noK9rKarCDtEUfPXadKk5A9H3WajmJ3UU6jwVBbr",
		"deprecated": {}
	}
}
```

#### Get All Proposals by Action Id

Request

```
GET {{baseUrl}}/api/:space/proposals/:actionId HTTP/1.1
```

Response

```
{
	"QmdWFWZZfz4GdZNHC1mqpAbjkr7DpNfZFeiZT4H7qDWk3x": {
		"address": "0xEd7B3f2902f2E1B17B027bD0c125B674d293bDA0",
		"msg": {
			"version": "0.2.0",
			"timestamp": "1610395170",
			"token": "0x8f56682a50becb1df2fb8136954f2062871bc7fc",
			"type": "proposal",
			"payload": {
				"name": "Teste",
				"body": "teste",
				"choices": ["Yes", "No"],
				"start": "1610395170",
				"end": "1610398770",
				"snapshot": 1,
				"metadata": {
					"private": 0,
					"type": "governance",
					"subType": "governance"
				},
				"nameHash": "0x9dc74d25d444fb1b1a41350e18236f9f3b75fda9cdf2bfed70ac7e87aa3c5c07",
				"bodyHash": "0xe0d4f6e915eb01068ecd79ce922236bf16c38b2d88cccffcbc57ed53ef3b74aa"
			}
		},
		"sig": "0x1f766480eb824a314a8a3352d608a9af9a9730e020b949a9b827d0a785c5140d1c780fa9c153562f22e0c56ff822f132b585548dc824f37db05aeb5f8a3f1a991b",
		"authorIpfsHash": "QmdWFWZZfz4GdZNHC1mqpAbjkr7DpNfZFeiZT4H7qDWk3x",
		"relayerIpfsHash": "Qmctq4noK9rKarCDtEUfPXadKk5A9H3WajmJ3UU6jwVBbr",
		"deprecated": {}
	}
}
```

#### Get All Proposals Votes by Proposal Id

Request

```
GET {{baseUrl}}/api/:space/proposal/:id/votes HTTP/1.1
```

Response

```
{
	"0xEd7B3f2902f2E1B17B027bD0c125B674d293bDA0": {
		"address": "0xEd7B3f2902f2E1B17B027bD0c125B674d293bDA0",
		"msg": {
			"version": "0.2.0",
			"timestamp": "1610395178",
			"token": "0x8f56682a50becb1df2fb8136954f2062871bc7fc",
			"type": "vote",
			"payload": {
				"choice": "no",
				"proposalIpfsHash": "QmdWFWZZfz4GdZNHC1mqpAbjkr7DpNfZFeiZT4H7qDWk3x",
				"metadata": {
					"memberAddress": "0xEd7B3f2902f2E1B17B027bD0c125B674d293bDA0"
				}
			}
		},
		"sig": "0x5003e28f0a1003ea69182d0901267cd89cbfa3e1bf63cd7ad301058345702d8b5bfc5fd2efc5f3105443a7e62f96cd31a0cb93a208f4fbe49cee55707f706d651c",
		"authorIpfsHash": "QmU1DDGitxH5DtyFkJo1djE5x2wtGCMjGYS4a2D48Z1qFN",
		"relayerIpfsHash": "QmcH5oQDKYLDGPCqnsVrmTLHjZccVD1HFYvraBUeEFzNJp",
		"deprecated": {}
	}
}
```

#### Get All Available Spaces

Request

```
GET {{baseUrl}}/api/spaces HTTP/1.1
```

Response

```
{
	"thelao": {
		"token": "0x8f56682a50becb1df2fb8136954f2062871bc7fc",
		"name": "The LAO",
		"network": "1",
		"symbol": "LAO",
		"skin": "thelao",
		"strategies": [{
			"name": "moloch",
			"params": {
				"address": "0x8f56682a50becb1df2fb8136954f2062871bc7fc",
				"symbol": "LAO",
				"decimals": 18
			}
		}],
		"filters": {
			"defaultTab": "all",
			"minScore": 1
		}
	},
	"flamingo": {
		"token": "0x43310bd1c8f261ee7b9025662207ed95329aa193",
		"name": "Flamingo DAO",
		"network": "1",
		"symbol": "FLA-C",
		"skin": "flamingo",
		"strategies": [{
			"name": "moloch",
			"params": {
				"address": "0x43310bd1c8f261ee7b9025662207ed95329aa193",
				"symbol": "FLA",
				"decimals": 18
			}
		}],
		"filters": {
			"defaultTab": "all",
			"minScore": 1
		}
	},
	"neptune": {
		"token": "0x95cb0a05f638999d26e97f9a2173ca30067a8009",
		"name": "Liquidity DAO",
		"network": "1",
		"symbol": "NEP",
		"skin": "neptune",
		"strategies": [{
			"name": "moloch",
			"params": {
				"address": "0x95cb0a05f638999d26e97f9a2173ca30067a8009",
				"symbol": "NEP",
				"decimals": 18
			}
		}],
		"filters": {
			"defaultTab": "all",
			"minScore": 1
		}
	}
}
```
