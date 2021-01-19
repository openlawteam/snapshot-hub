# snapshot-hub

### Environment Variables

```
# The API Server port
PORT=8080

# To indicate in which environment it is being executed: local, dev, or prod
ENV=local

# The PK of the account that will be used to sign the messages, for example:
RELAYER_PK=0x49b803c4495fbedafbfbb9399fcc212286b4bc21caafe06e609762d913ed0ef7

# The network name that will be used by the relayer (use testnet for: rinkeby or ropsten), and mainnet for the main eth network
NETWORK=testnet

# The postgres url: postgres://user:pwd@host:5432/db-name
JAWSDB_URL=postgres://admin:admin@snapshot-postgres:5432/snapshot

# You can use pinata or fleek
PINNING_SERVICE=pinata

# Pinata API Keys
PINATA_SECRET_API_KEY=(https://pinata.cloud/)
PINATA_API_KEY=(https://pinata.cloud/)

# Fleek API Keys (you don't need to set Fleek and Pinata keys, pick only one pinning service)
FLEEK_API_KEY=(https://fleek.co/)
FLEEK_API_SECRET=(https://fleek.co/)

# The list of domains that should be allowed to send requests to the API
ALLOWED_DOMAINS=http://localhost:3000

# The relayer API (alternative to Infura)
ALCHEMY_API_URL=https://eth-rinkeby.alchemyapi.io/v2/<your-api-key>
```

### Running

> \$ docker-compose up --build

### API

### Create Draft

Required Attributes

- **body**: `address`, `msg`, `sig`
- **msg**: `payload`, `timestamp`, `token`, `space`, `type`, `actionId`, `version`, `chainId`, `verifyingContract`
- **payload**: `name`, `body`, `choices`, `metadata`
- **type**: must be `draft`

Request

```
POST {{baseUrl}}/api/message HTTP/1.1
Content-Type: application/json
```

```json
{
  "address": "0xEd7B3f2902f2E1B17B027bD0c125B674d293bDA0",
  "msg": "{\"payload\":{\"body\":\"AAAA\",\"choices\":[\"Yes\",\"No\"],\"metadata\":{\"uuid\":\"0xEd7B3f2902f2E1B17B027bD0c125B674d293bDA0\",\"private\":0,\"type\":\"governance\",\"subType\":\"governance\"},\"name\":\"AAA\"},\"actionId\":\"0x4539Bac77398aF6d582842F174464b29cf3887ce\",\"chainId\":3,\"space\":\"thelao\",\"timestamp\":\"1610736721\",\"token\":\"0x8f56682a50becb1df2fb8136954f2062871bc7fc\",\"type\":\"draft\",\"verifyingContract\":\"0xcFc2206eAbFDc5f3d9e7fA54f855A8C15D196c05\",\"version\":\"0.2.0\"}",
  "sig": "0xb8afb9098b70f1e46df8e5586f0737ad7209fa3405cdbff05405e9c542dc0f0a301e413cfe85a59f94b086154683b0c6af995dfb7373770c7f3fb26b12fab81d1b"
}
```

Response

- **uniqueId**: the erc712 hash of the Draft message.

```json
{
  "uniqueId": "0xc90ff1f7af9e15bad7bd799bb41da7c034c9112e1f16e36ed50d3f8ae9725c50"
}
```

#### Create Proposal

Required Attributes

- **body**: `address`, `msg`, `sig`
- **msg**: `payload`, `timestamp`, `token`, `space`, `type`, `actionId`, `version`, `chainId`, `verifyingContract`
- **payload**: `name`, `body`, `choices`, `start`, `end`, `snapshot`, `metadata`
- **type**: must be `proposal`

Request

```
POST {{baseUrl}}/api/message HTTP/1.1
Content-Type: application/json
```

```json
{
  "address": "0xEd7B3f2902f2E1B17B027bD0c125B674d293bDA0",
  "msg": "{\"payload\":{\"body\":\"SSS\",\"choices\":[\"Yes\",\"No\"],\"end\":1610740456,\"metadata\":{\"uuid\":\"0xEd7B3f2902f2E1B17B027bD0c125B674d293bDA0\",\"private\":0,\"type\":\"general\",\"subType\":\"general\"},\"name\":\"SSS\",\"start\":1610736856,\"snapshot\":1222},\"actionId\":\"0x4539Bac77398aF6d582842F174464b29cf3887ce\",\"chainId\":3,\"space\":\"thelao\",\"timestamp\":\"1610736856\",\"token\":\"0x8f56682a50becb1df2fb8136954f2062871bc7fc\",\"type\":\"proposal\",\"verifyingContract\":\"0xcFc2206eAbFDc5f3d9e7fA54f855A8C15D196c05\",\"version\":\"0.2.0\"}",
  "sig": "0x2ccd27c8906051ae113bd913d78d16fa03e0f5662c39052069ec1baa8ad5fc2a73360f58f688390935837105e40b62f34fe18b76c7b0c95e35e5a6f9ca1dd94a1b"
}
```

Response

- **uniqueId**: the erc712 hash of the Proposal message.
- **uniqueIdDraft**: the erc712 hash of the Draft. If the proposal does not have a draft, it gets generated either way because the draft content is contained in the proposal content.

```json
{
  "uniqueId": "0xfaa09abe714291de6d3b5a6daa0330e5d4367188680b02cbc042243269fa050c",
  "uniqueIdDraft": "0x8a08d261151050b116587a14e54af9f3171727f8581aeb8f797a47499df59c6d"
}
```

#### Voting

Required Attributes

- **body**: `address`, `msg`, `sig`
- **msg**: `payload`, `timestamp`, `token`, `space`, `type`, `actionId`, `version`, `chainId`, `verifyingContract`
- **payload**: `choice`, `proposalHash`, `metadata`
- **type**: must be `vote`
- **proposalHash**: the erc712 hash of the Proposal.

Request

```
POST {{baseUrl}}/api/message HTTP/1.1
Content-Type: application/json
```

```json
{
  "address": "0xEd7B3f2902f2E1B17B027bD0c125B674d293bDA0",
  "msg": "{\"payload\":{\"choice\":2,\"proposalHash\":\"0xfaa09abe714291de6d3b5a6daa0330e5d4367188680b02cbc042243269fa050c\",\"metadata\":{\"memberAddress\":\"0xEd7B3f2902f2E1B17B027bD0c125B674d293bDA0\"}},\"actionId\":\"0x4539Bac77398aF6d582842F174464b29cf3887ce\",\"chainId\":3,\"space\":\"thelao\",\"timestamp\":\"1610737020\",\"token\":\"0x8f56682a50becb1df2fb8136954f2062871bc7fc\",\"type\":\"vote\",\"verifyingContract\":\"0xcFc2206eAbFDc5f3d9e7fA54f855A8C15D196c05\",\"version\":\"0.2.0\"}",
  "sig": "0x2f2eeda5e5fce7ff2cd53a2c98b9d32a325b83a1e2c9b80f7f14773a0d5347cb604c711ec9b024f985c413667f9410b610213892629c5bff779e764139c36d051b"
}
```

Response

- **uniqueId**: the erc712 hash of the Vote message.

```json
{
  "uniqueId": "0x0a7abbbfbad762379af65b5dcc51a513983b9ce5e927843310927a01841daf5c"
}
```

#### Get All Drafts

Request

```
GET {{baseUrl}}/api/:space/drafts HTTP/1.1
```

Response

```json
{
  "0xc90ff1f7af9e15bad7bd799bb41da7c034c9112e1f16e36ed50d3f8ae9725c50": {
    "address": "0xEd7B3f2902f2E1B17B027bD0c125B674d293bDA0",
    "msg": {
      "version": "0.2.0",
      "timestamp": "1610736721",
      "token": "0x8f56682a50becb1df2fb8136954f2062871bc7fc",
      "type": "draft",
      "payload": {
        "body": "AAAA",
        "choices": ["Yes", "No"],
        "metadata": {
          "uuid": "0xEd7B3f2902f2E1B17B027bD0c125B674d293bDA0",
          "private": 0,
          "type": "governance",
          "subType": "governance"
        },
        "name": "AAA"
      }
    },
    "sig": "0xb8afb9098b70f1e46df8e5586f0737ad7209fa3405cdbff05405e9c542dc0f0a301e413cfe85a59f94b086154683b0c6af995dfb7373770c7f3fb26b12fab81d1b",
    "authorIpfsHash": "0xc90ff1f7af9e15bad7bd799bb41da7c034c9112e1f16e36ed50d3f8ae9725c50",
    "relayerIpfsHash": "QmWvJoc2cTveACbFCGFSCEaGVDPVRUc19QPfRjPe14wUHG",
    "actionId": "0x4539Bac77398aF6d582842F174464b29cf3887ce"
  },
  "0xe2169035d5cfdf546ffa448c8b705b135960d815e7de6a47271b8b94eca0f6fb": {
    "address": "0xEd7B3f2902f2E1B17B027bD0c125B674d293bDA0",
    "msg": {
      "version": "0.2.0",
      "timestamp": "1610736150",
      "token": "0x8f56682a50becb1df2fb8136954f2062871bc7fc",
      "type": "draft",
      "payload": {
        "body": "asd",
        "choices": ["Yes", "No"],
        "metadata": {
          "uuid": "0xEd7B3f2902f2E1B17B027bD0c125B674d293bDA0",
          "private": 0,
          "type": "governance",
          "subType": "governance"
        },
        "name": "asd"
      }
    },
    "sig": "0x5d7e062bab36007845cf1d324f56bbe32da7aab317aab5459f31d02bb7633ccd33cd9a53166bb9077964c430d3690598588604d7d54e215aa21c9e49f1ab00ea1c",
    "authorIpfsHash": "0xe2169035d5cfdf546ffa448c8b705b135960d815e7de6a47271b8b94eca0f6fb",
    "relayerIpfsHash": "QmbQvvEajHWgAVs7nsJFpDqhqBrtJouSrLMb7z7mUjVBpZ",
    "actionId": "0x4539Bac77398aF6d582842F174464b29cf3887ce"
  }
}
```

#### Get All Drafts by Action Id

Request

```
GET {{baseUrl}}/api/:space/drafts/:actionId HTTP/1.1
```

Response

```json
{
  "0xc90ff1f7af9e15bad7bd799bb41da7c034c9112e1f16e36ed50d3f8ae9725c50": {
    "address": "0xEd7B3f2902f2E1B17B027bD0c125B674d293bDA0",
    "msg": {
      "version": "0.2.0",
      "timestamp": "1610736721",
      "token": "0x8f56682a50becb1df2fb8136954f2062871bc7fc",
      "type": "draft",
      "payload": {
        "body": "AAAA",
        "choices": ["Yes", "No"],
        "metadata": {
          "uuid": "0xEd7B3f2902f2E1B17B027bD0c125B674d293bDA0",
          "private": 0,
          "type": "governance",
          "subType": "governance"
        },
        "name": "AAA"
      }
    },
    "sig": "0xb8afb9098b70f1e46df8e5586f0737ad7209fa3405cdbff05405e9c542dc0f0a301e413cfe85a59f94b086154683b0c6af995dfb7373770c7f3fb26b12fab81d1b",
    "authorIpfsHash": "0xc90ff1f7af9e15bad7bd799bb41da7c034c9112e1f16e36ed50d3f8ae9725c50",
    "relayerIpfsHash": "QmWvJoc2cTveACbFCGFSCEaGVDPVRUc19QPfRjPe14wUHG",
    "actionId": "0x4539Bac77398aF6d582842F174464b29cf3887ce"
  },
  "0xe2169035d5cfdf546ffa448c8b705b135960d815e7de6a47271b8b94eca0f6fb": {
    "address": "0xEd7B3f2902f2E1B17B027bD0c125B674d293bDA0",
    "msg": {
      "version": "0.2.0",
      "timestamp": "1610736150",
      "token": "0x8f56682a50becb1df2fb8136954f2062871bc7fc",
      "type": "draft",
      "payload": {
        "body": "asd",
        "choices": ["Yes", "No"],
        "metadata": {
          "uuid": "0xEd7B3f2902f2E1B17B027bD0c125B674d293bDA0",
          "private": 0,
          "type": "governance",
          "subType": "governance"
        },
        "name": "asd"
      }
    },
    "sig": "0x5d7e062bab36007845cf1d324f56bbe32da7aab317aab5459f31d02bb7633ccd33cd9a53166bb9077964c430d3690598588604d7d54e215aa21c9e49f1ab00ea1c",
    "authorIpfsHash": "0xe2169035d5cfdf546ffa448c8b705b135960d815e7de6a47271b8b94eca0f6fb",
    "relayerIpfsHash": "QmbQvvEajHWgAVs7nsJFpDqhqBrtJouSrLMb7z7mUjVBpZ",
    "actionId": "0x4539Bac77398aF6d582842F174464b29cf3887ce"
  }
}
```

#### Get Draft by Id

Request

```
GET {{baseUrl}}/api/:space/draft/:id HTTP/1.1
```

Response

```json
{
  "0xe2169035d5cfdf546ffa448c8b705b135960d815e7de6a47271b8b94eca0f6fb": {
    "address": "0xEd7B3f2902f2E1B17B027bD0c125B674d293bDA0",
    "msg": {
      "version": "0.2.0",
      "timestamp": "1610736150",
      "token": "0x8f56682a50becb1df2fb8136954f2062871bc7fc",
      "type": "draft",
      "payload": {
        "body": "asd",
        "choices": ["Yes", "No"],
        "metadata": {
          "uuid": "0xEd7B3f2902f2E1B17B027bD0c125B674d293bDA0",
          "private": 0,
          "type": "governance",
          "subType": "governance"
        },
        "name": "asd"
      }
    },
    "sig": "0x5d7e062bab36007845cf1d324f56bbe32da7aab317aab5459f31d02bb7633ccd33cd9a53166bb9077964c430d3690598588604d7d54e215aa21c9e49f1ab00ea1c",
    "authorIpfsHash": "0xe2169035d5cfdf546ffa448c8b705b135960d815e7de6a47271b8b94eca0f6fb",
    "relayerIpfsHash": "QmbQvvEajHWgAVs7nsJFpDqhqBrtJouSrLMb7z7mUjVBpZ",
    "actionId": "0x4539Bac77398aF6d582842F174464b29cf3887ce"
  }
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
	"0xfaa09abe714291de6d3b5a6daa0330e5d4367188680b02cbc042243269fa050c": {
		"address": "0xEd7B3f2902f2E1B17B027bD0c125B674d293bDA0",
		"msg": {
			"version": "0.2.0",
			"timestamp": "1610736856",
			"token": "0x8f56682a50becb1df2fb8136954f2062871bc7fc",
			"type": "proposal",
			"payload": {
				"body": "SSS",
				"choices": ["Yes", "No"],
				"end": 1610740456,
				"metadata": {
					"uuid": "0xEd7B3f2902f2E1B17B027bD0c125B674d293bDA0",
					"private": 0,
					"type": "general",
					"subType": "general"
				},
				"name": "SSS",
				"start": 1610736856,
				"snapshot": 1222
			}
		},
		"sig": "0x2ccd27c8906051ae113bd913d78d16fa03e0f5662c39052069ec1baa8ad5fc2a73360f58f688390935837105e40b62f34fe18b76c7b0c95e35e5a6f9ca1dd94a1b",
		"authorIpfsHash": "0xfaa09abe714291de6d3b5a6daa0330e5d4367188680b02cbc042243269fa050c",
		"relayerIpfsHash": "QmbgiYmo93sJi4KmB6DtN9YCL4XQCUWrxDt53mknkw1MYW",
		"actionId": "0x4539Bac77398aF6d582842F174464b29cf3887ce"
	},
	"0x200bc675bc55672f49401857255776026be86d8a1f2dc0b9d7b2bee8eb3e1336": {
		"address": "0xEd7B3f2902f2E1B17B027bD0c125B674d293bDA0",
		"msg": {
			"version": "0.2.0",
			"timestamp": "1610736470",
			"token": "0x8f56682a50becb1df2fb8136954f2062871bc7fc",
			"type": "proposal",
			"payload": {
				"body": "aaaaaaaa",
				"choices": ["Yes", "No"],
				"end": 1610740070,
				"metadata": {
					"uuid": "0xEd7B3f2902f2E1B17B027bD0c125B674d293bDA0",
					"private": 0,
					"type": "governance",
					"subType": "governance"
				},
				"name": "aaaa",
				"start": 1610736470,
				"snapshot": 1222
			}
		},
		"sig": "0x332ecb1e0695a11ccb16f2625110ac6aad1e1a0732dea49f71cea8c97d8cb3e27b0a7650c1c4277a8c3c91c8a1f66c1b31d16d258a6797083133136f73331d951b",
		"authorIpfsHash": "0x200bc675bc55672f49401857255776026be86d8a1f2dc0b9d7b2bee8eb3e1336",
		"relayerIpfsHash": "QmVizXvbaHMK4D6WWxPvsXD8UFAUc927TpDcPy9HjHLC5k",
		"actionId": "0x4539Bac77398aF6d582842F174464b29cf3887ce"
	},
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
	"0xfaa09abe714291de6d3b5a6daa0330e5d4367188680b02cbc042243269fa050c": {
		"address": "0xEd7B3f2902f2E1B17B027bD0c125B674d293bDA0",
		"msg": {
			"version": "0.2.0",
			"timestamp": "1610736856",
			"token": "0x8f56682a50becb1df2fb8136954f2062871bc7fc",
			"type": "proposal",
			"payload": {
				"body": "SSS",
				"choices": ["Yes", "No"],
				"end": 1610740456,
				"metadata": {
					"uuid": "0xEd7B3f2902f2E1B17B027bD0c125B674d293bDA0",
					"private": 0,
					"type": "general",
					"subType": "general"
				},
				"name": "SSS",
				"start": 1610736856,
				"snapshot": 1222
			}
		},
		"sig": "0x2ccd27c8906051ae113bd913d78d16fa03e0f5662c39052069ec1baa8ad5fc2a73360f58f688390935837105e40b62f34fe18b76c7b0c95e35e5a6f9ca1dd94a1b",
		"authorIpfsHash": "0xfaa09abe714291de6d3b5a6daa0330e5d4367188680b02cbc042243269fa050c",
		"relayerIpfsHash": "QmbgiYmo93sJi4KmB6DtN9YCL4XQCUWrxDt53mknkw1MYW",
		"actionId": "0x4539Bac77398aF6d582842F174464b29cf3887ce"
	},
	"0x200bc675bc55672f49401857255776026be86d8a1f2dc0b9d7b2bee8eb3e1336": {
		"address": "0xEd7B3f2902f2E1B17B027bD0c125B674d293bDA0",
		"msg": {
			"version": "0.2.0",
			"timestamp": "1610736470",
			"token": "0x8f56682a50becb1df2fb8136954f2062871bc7fc",
			"type": "proposal",
			"payload": {
				"body": "aaaaaaaa",
				"choices": ["Yes", "No"],
				"end": 1610740070,
				"metadata": {
					"uuid": "0xEd7B3f2902f2E1B17B027bD0c125B674d293bDA0",
					"private": 0,
					"type": "governance",
					"subType": "governance"
				},
				"name": "aaaa",
				"start": 1610736470,
				"snapshot": 1222
			}
		},
		"sig": "0x332ecb1e0695a11ccb16f2625110ac6aad1e1a0732dea49f71cea8c97d8cb3e27b0a7650c1c4277a8c3c91c8a1f66c1b31d16d258a6797083133136f73331d951b",
		"authorIpfsHash": "0x200bc675bc55672f49401857255776026be86d8a1f2dc0b9d7b2bee8eb3e1336",
		"relayerIpfsHash": "QmVizXvbaHMK4D6WWxPvsXD8UFAUc927TpDcPy9HjHLC5k",
		"actionId": "0x4539Bac77398aF6d582842F174464b29cf3887ce"
	},
}
```

#### Get Proposal by Id

Request

```
GET {{baseUrl}}/api/:space/proposal/:id HTTP/1.1
```

Response

```json
{
  "0xfaa09abe714291de6d3b5a6daa0330e5d4367188680b02cbc042243269fa050c": {
    "address": "0xEd7B3f2902f2E1B17B027bD0c125B674d293bDA0",
    "msg": {
      "version": "0.2.0",
      "timestamp": "1610736856",
      "token": "0x8f56682a50becb1df2fb8136954f2062871bc7fc",
      "type": "proposal",
      "payload": {
        "body": "SSS",
        "choices": ["Yes", "No"],
        "end": 1610740456,
        "metadata": {
          "uuid": "0xEd7B3f2902f2E1B17B027bD0c125B674d293bDA0",
          "private": 0,
          "type": "general",
          "subType": "general"
        },
        "name": "SSS",
        "start": 1610736856,
        "snapshot": 1222
      }
    },
    "sig": "0x2ccd27c8906051ae113bd913d78d16fa03e0f5662c39052069ec1baa8ad5fc2a73360f58f688390935837105e40b62f34fe18b76c7b0c95e35e5a6f9ca1dd94a1b",
    "authorIpfsHash": "0xfaa09abe714291de6d3b5a6daa0330e5d4367188680b02cbc042243269fa050c",
    "relayerIpfsHash": "QmbgiYmo93sJi4KmB6DtN9YCL4XQCUWrxDt53mknkw1MYW",
    "actionId": "0x4539Bac77398aF6d582842F174464b29cf3887ce"
  }
}
```

#### Get All Proposal Votes by Proposal Id

Request

```
GET {{baseUrl}}/api/:space/proposal/:id/votes HTTP/1.1
```

Response

```json
{
  "0xEd7B3f2902f2E1B17B027bD0c125B674d293bDA0": {
    "address": "0xEd7B3f2902f2E1B17B027bD0c125B674d293bDA0",
    "msg": {
      "version": "0.2.0",
      "timestamp": "1610737020",
      "token": "0x8f56682a50becb1df2fb8136954f2062871bc7fc",
      "type": "vote",
      "payload": {
        "choice": 2,
        "proposalHash": "0xfaa09abe714291de6d3b5a6daa0330e5d4367188680b02cbc042243269fa050c",
        "metadata": {
          "memberAddress": "0xEd7B3f2902f2E1B17B027bD0c125B674d293bDA0"
        }
      }
    },
    "sig": "0x2f2eeda5e5fce7ff2cd53a2c98b9d32a325b83a1e2c9b80f7f14773a0d5347cb604c711ec9b024f985c413667f9410b610213892629c5bff779e764139c36d051b",
    "authorIpfsHash": "0x0a7abbbfbad762379af65b5dcc51a513983b9ce5e927843310927a01841daf5c",
    "relayerIpfsHash": "QmSxbsjgpGUzKRoURFbhhvcp3dyJzFLh8UjfATfyN4brRj",
    "actionId": "0x4539Bac77398aF6d582842F174464b29cf3887ce"
  }
}
```

#### Get All Available Spaces

Request

```
GET {{baseUrl}}/api/spaces HTTP/1.1
```

Response

```json
{
  "thelao": {
    "token": "0x8f56682a50becb1df2fb8136954f2062871bc7fc",
    "name": "The LAO",
    "network": "1",
    "symbol": "LAO",
    "skin": "thelao",
    "strategies": [
      {
        "name": "moloch",
        "params": {
          "address": "0x8f56682a50becb1df2fb8136954f2062871bc7fc",
          "symbol": "LAO",
          "decimals": 18
        }
      }
    ],
    "filters": { "defaultTab": "all", "minScore": 1 }
  },
  "flamingo": {
    "token": "0x43310bd1c8f261ee7b9025662207ed95329aa193",
    "name": "Flamingo DAO",
    "network": "1",
    "symbol": "FLA-C",
    "skin": "flamingo",
    "strategies": [
      {
        "name": "moloch",
        "params": {
          "address": "0x43310bd1c8f261ee7b9025662207ed95329aa193",
          "symbol": "FLA",
          "decimals": 18
        }
      }
    ],
    "filters": { "defaultTab": "all", "minScore": 1 }
  },
  "neptune": {
    "token": "0x95cb0a05f638999d26e97f9a2173ca30067a8009",
    "name": "Liquidity DAO",
    "network": "1",
    "symbol": "NEP",
    "skin": "neptune",
    "strategies": [
      {
        "name": "moloch",
        "params": {
          "address": "0x95cb0a05f638999d26e97f9a2173ca30067a8009",
          "symbol": "NEP",
          "decimals": 18
        }
      }
    ],
    "filters": { "defaultTab": "all", "minScore": 1 }
  }
}
```
