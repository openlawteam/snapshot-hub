# snapshot-hub

### Running

> \$ docker-compose up --build

### API

### Create Draft

Required Attributes

- **body**: `address`, `msg`, `sig`
- **msg**: `payload`, `timestamp`, `token`, `space`, `type`, `actionId`, `version`, `chainId`, `verifyingContract`, `spaceHash`
- **payload**: `name`, `body`, `choices`, `metadata`, `nameHash`, `bodyHash`
- **type**: must be `draft`

Request

```
POST {{baseUrl}}/api/message HTTP/1.1
Content-Type: application/json
```

```json
TODO
```

Response

```json
TODO
```

#### Create Proposal

Required Attributes

- **body**: `address`, `msg`, `sig`
- **msg**: `payload`, `timestamp`, `token`, `space`, `type`, `actionId`, `version`, `chainId`, `verifyingContract`, `spaceHash`
- **payload**: `name`, `body`, `choices`, `start`, `end`, `snapshot`, `metadata`, `nameHash`, `bodyHash`
- **type**: must be `proposal`

Request

```
POST {{baseUrl}}/api/message HTTP/1.1
Content-Type: application/json
```

```json
{
  "address": "0xEd7B3f2902f2E1B17B027bD0c125B674d293bDA0",
  "msg": "{\"payload\":{\"name\":\"Test\",\"body\":\"Test\",\"choices\":[\"Yes\",\"No\"],\"start\":\"1610473885\",\"end\":\"1610477485\",\"snapshot\":1,\"metadata\":{\"private\":0,\"type\":\"general\",\"subType\":\"general\"},\"nameHash\":\"0x85cc825a98ec217d960f113f5f80a95d7fd18e3725d37df428eb14f880bdfc12\",\"bodyHash\":\"0x85cc825a98ec217d960f113f5f80a95d7fd18e3725d37df428eb14f880bdfc12\"},\"timestamp\":\"1610473885\",\"token\":\"0x8f56682a50becb1df2fb8136954f2062871bc7fc\",\"space\":\"thelao\",\"type\":\"proposal\",\"actionId\":\"0x4539Bac77398aF6d582842F174464b29cf3887ce\",\"version\":\"0.2.0\",\"chainId\":1337,\"verifyingContract\":\"0xcFc2206eAbFDc5f3d9e7fA54f855A8C15D196c05\",\"spaceHash\":\"0x4b06809c3104de1eaf356c04efd4fa3b56d67554fcf451d978fc02826c2d43ce\"}",
  "sig": "0x7871d6d93738ebeeaf35964ca158ebd23f8227acd8ce483c852c62d5db67662c6eb3e34a57e958f703929dffcf671cc4b60a3acc3834bf8c7a181dfd40b807511c"
}
```

Response

```json
{
  "ipfsHash": "QmZWrANXdRwwRCABUEDyELn6MDghSwH5tH7PkBFy3v2jkH"
}
```

#### Voting

Required Attributes

- **body**: `address`, `msg`, `sig`
- **msg**: `payload`, `timestamp`, `token`, `space`, `type`, `actionId`, `version`, `chainId`, `verifyingContract`, `spaceHash`
- **payload**: `choice`, `proposalIpfsHash`, `metadata`
- **type**: must be `vote`

Request

```
POST {{baseUrl}}/api/message HTTP/1.1
Content-Type: application/json
```

```json
{
  "address": "0xEd7B3f2902f2E1B17B027bD0c125B674d293bDA0",
  "msg": "{\"payload\":{\"choice\":\"no\",\"proposalIpfsHash\":\"QmZWrANXdRwwRCABUEDyELn6MDghSwH5tH7PkBFy3v2jkH\",\"metadata\":{\"memberAddress\":\"0xEd7B3f2902f2E1B17B027bD0c125B674d293bDA0\"}},\"timestamp\":\"1610473893\",\"token\":\"0x8f56682a50becb1df2fb8136954f2062871bc7fc\",\"space\":\"thelao\",\"type\":\"vote\",\"version\":\"0.2.0\",\"actionId\":\"0x4539Bac77398aF6d582842F174464b29cf3887ce\",\"chainId\":1337,\"verifyingContract\":\"0xcFc2206eAbFDc5f3d9e7fA54f855A8C15D196c05\",\"spaceHash\":\"0x4b06809c3104de1eaf356c04efd4fa3b56d67554fcf451d978fc02826c2d43ce\"}",
  "sig": "0x32e5453f73fae96ba450b0a568b03b684f3e72a825e84b5762574b01a67b121e37c884af8b3357292311538b4d1eec3cfe403c0501b9877289050ab0ec4ffd7b1c"
}
```

Response

```json
{
  "ipfsHash": "QmQxx26HpNVBHYW997aYXmRvdKQj3Qh2HfV4BPVVgQM3Pz"
}
```

#### Get All Drafts

Request

```
GET {{baseUrl}}/api/:space/drafts HTTP/1.1
```

Response

```
{
	"QmZWrANXdRwwRCABUEDyELn6MDghSwH5tH7PkBFy3v2jkH": {
		"address": "0xEd7B3f2902f2E1B17B027bD0c125B674d293bDA0",
		"msg": {
			"version": "0.2.0",
			"timestamp": "1610473885",
			"token": "0x8f56682a50becb1df2fb8136954f2062871bc7fc",
			"type": "draft",
			"payload": {
				"name": "Test",
				"body": "Test",
				"choices": ["Yes", "No"],
				"metadata": {
					"private": 0,
					"type": "general",
					"subType": "general"
				},
				"nameHash": "0x85cc825a98ec217d960f113f5f80a95d7fd18e3725d37df428eb14f880bdfc12",
				"bodyHash": "0x85cc825a98ec217d960f113f5f80a95d7fd18e3725d37df428eb14f880bdfc12"
			}
		},
		"sig": "0x7871d6d93738ebeeaf35964ca158ebd23f8227acd8ce483c852c62d5db67662c6eb3e34a57e958f703929dffcf671cc4b60a3acc3834bf8c7a181dfd40b807511c",
		"authorIpfsHash": "QmZWrANXdRwwRCABUEDyELn6MDghSwH5tH7PkBFy3v2jkH",
		"relayerIpfsHash": "QmQA3kSmCAU6o1Bzm6Kf3WhwGynvbMwfx5xcML23Li4iY4",
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

```
{
	"QmZWrANXdRwwRCABUEDyELn6MDghSwH5tH7PkBFy3v2jkH": {
		"address": "0xEd7B3f2902f2E1B17B027bD0c125B674d293bDA0",
		"msg": {
			"version": "0.2.0",
			"timestamp": "1610473885",
			"token": "0x8f56682a50becb1df2fb8136954f2062871bc7fc",
			"type": "draft",
			"payload": {
				"name": "Test",
				"body": "Test",
				"choices": ["Yes", "No"],
				"metadata": {
					"private": 0,
					"type": "general",
					"subType": "general"
				},
				"nameHash": "0x85cc825a98ec217d960f113f5f80a95d7fd18e3725d37df428eb14f880bdfc12",
				"bodyHash": "0x85cc825a98ec217d960f113f5f80a95d7fd18e3725d37df428eb14f880bdfc12"
			}
		},
		"sig": "0x7871d6d93738ebeeaf35964ca158ebd23f8227acd8ce483c852c62d5db67662c6eb3e34a57e958f703929dffcf671cc4b60a3acc3834bf8c7a181dfd40b807511c",
		"authorIpfsHash": "QmZWrANXdRwwRCABUEDyELn6MDghSwH5tH7PkBFy3v2jkH",
		"relayerIpfsHash": "QmQA3kSmCAU6o1Bzm6Kf3WhwGynvbMwfx5xcML23Li4iY4",
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
  "QmZWrANXdRwwRCABUEDyELn6MDghSwH5tH7PkBFy3v2jkH": {
    "address": "0xEd7B3f2902f2E1B17B027bD0c125B674d293bDA0",
    "msg": {
      "version": "0.2.0",
      "timestamp": "1610473885",
      "token": "0x8f56682a50becb1df2fb8136954f2062871bc7fc",
      "type": "draft",
      "payload": {
        "name": "Test",
        "body": "Test",
        "choices": ["Yes", "No"],
        "metadata": {
          "private": 0,
          "type": "general",
          "subType": "general"
        },
        "nameHash": "0x85cc825a98ec217d960f113f5f80a95d7fd18e3725d37df428eb14f880bdfc12",
        "bodyHash": "0x85cc825a98ec217d960f113f5f80a95d7fd18e3725d37df428eb14f880bdfc12"
      }
    },
    "sig": "0x7871d6d93738ebeeaf35964ca158ebd23f8227acd8ce483c852c62d5db67662c6eb3e34a57e958f703929dffcf671cc4b60a3acc3834bf8c7a181dfd40b807511c",
    "authorIpfsHash": "QmZWrANXdRwwRCABUEDyELn6MDghSwH5tH7PkBFy3v2jkH",
    "relayerIpfsHash": "QmQA3kSmCAU6o1Bzm6Kf3WhwGynvbMwfx5xcML23Li4iY4",
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
	"QmZWrANXdRwwRCABUEDyELn6MDghSwH5tH7PkBFy3v2jkH": {
		"address": "0xEd7B3f2902f2E1B17B027bD0c125B674d293bDA0",
		"msg": {
			"version": "0.2.0",
			"timestamp": "1610473885",
			"token": "0x8f56682a50becb1df2fb8136954f2062871bc7fc",
			"type": "proposal",
			"payload": {
				"name": "Test",
				"body": "Test",
				"choices": ["Yes", "No"],
				"start": "1610473885",
				"end": "1610477485",
				"snapshot": 1,
				"metadata": {
					"private": 0,
					"type": "general",
					"subType": "general"
				},
				"nameHash": "0x85cc825a98ec217d960f113f5f80a95d7fd18e3725d37df428eb14f880bdfc12",
				"bodyHash": "0x85cc825a98ec217d960f113f5f80a95d7fd18e3725d37df428eb14f880bdfc12"
			}
		},
		"sig": "0x7871d6d93738ebeeaf35964ca158ebd23f8227acd8ce483c852c62d5db67662c6eb3e34a57e958f703929dffcf671cc4b60a3acc3834bf8c7a181dfd40b807511c",
		"authorIpfsHash": "QmZWrANXdRwwRCABUEDyELn6MDghSwH5tH7PkBFy3v2jkH",
		"relayerIpfsHash": "QmQA3kSmCAU6o1Bzm6Kf3WhwGynvbMwfx5xcML23Li4iY4",
		"actionId": "0x4539Bac77398aF6d582842F174464b29cf3887ce"
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
	"QmZWrANXdRwwRCABUEDyELn6MDghSwH5tH7PkBFy3v2jkH": {
		"address": "0xEd7B3f2902f2E1B17B027bD0c125B674d293bDA0",
		"msg": {
			"version": "0.2.0",
			"timestamp": "1610473885",
			"token": "0x8f56682a50becb1df2fb8136954f2062871bc7fc",
			"type": "proposal",
			"payload": {
				"name": "Test",
				"body": "Test",
				"choices": ["Yes", "No"],
				"start": "1610473885",
				"end": "1610477485",
				"snapshot": 1,
				"metadata": {
					"private": 0,
					"type": "general",
					"subType": "general"
				},
				"nameHash": "0x85cc825a98ec217d960f113f5f80a95d7fd18e3725d37df428eb14f880bdfc12",
				"bodyHash": "0x85cc825a98ec217d960f113f5f80a95d7fd18e3725d37df428eb14f880bdfc12"
			}
		},
		"sig": "0x7871d6d93738ebeeaf35964ca158ebd23f8227acd8ce483c852c62d5db67662c6eb3e34a57e958f703929dffcf671cc4b60a3acc3834bf8c7a181dfd40b807511c",
		"authorIpfsHash": "QmZWrANXdRwwRCABUEDyELn6MDghSwH5tH7PkBFy3v2jkH",
		"relayerIpfsHash": "QmQA3kSmCAU6o1Bzm6Kf3WhwGynvbMwfx5xcML23Li4iY4",
		"actionId": "0x4539Bac77398aF6d582842F174464b29cf3887ce"
	}
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
  "QmZWrANXdRwwRCABUEDyELn6MDghSwH5tH7PkBFy3v2jkH": {
    "address": "0xEd7B3f2902f2E1B17B027bD0c125B674d293bDA0",
    "msg": {
      "version": "0.2.0",
      "timestamp": "1610473885",
      "token": "0x8f56682a50becb1df2fb8136954f2062871bc7fc",
      "type": "proposal",
      "payload": {
        "name": "Test",
        "body": "Test",
        "choices": ["Yes", "No"],
        "start": "1610473885",
        "end": "1610477485",
        "snapshot": 1,
        "metadata": {
          "private": 0,
          "type": "general",
          "subType": "general"
        },
        "nameHash": "0x85cc825a98ec217d960f113f5f80a95d7fd18e3725d37df428eb14f880bdfc12",
        "bodyHash": "0x85cc825a98ec217d960f113f5f80a95d7fd18e3725d37df428eb14f880bdfc12"
      }
    },
    "sig": "0x7871d6d93738ebeeaf35964ca158ebd23f8227acd8ce483c852c62d5db67662c6eb3e34a57e958f703929dffcf671cc4b60a3acc3834bf8c7a181dfd40b807511c",
    "authorIpfsHash": "QmZWrANXdRwwRCABUEDyELn6MDghSwH5tH7PkBFy3v2jkH",
    "relayerIpfsHash": "QmQA3kSmCAU6o1Bzm6Kf3WhwGynvbMwfx5xcML23Li4iY4",
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

```
{
	"0xEd7B3f2902f2E1B17B027bD0c125B674d293bDA0": {
		"address": "0xEd7B3f2902f2E1B17B027bD0c125B674d293bDA0",
		"msg": {
			"version": "0.2.0",
			"timestamp": "1610473893",
			"token": "0x8f56682a50becb1df2fb8136954f2062871bc7fc",
			"type": "vote",
			"payload": {
				"choice": "no",
				"proposalIpfsHash": "QmZWrANXdRwwRCABUEDyELn6MDghSwH5tH7PkBFy3v2jkH",
				"metadata": {
					"memberAddress": "0xEd7B3f2902f2E1B17B027bD0c125B674d293bDA0"
				}
			}
		},
		"sig": "0x32e5453f73fae96ba450b0a568b03b684f3e72a825e84b5762574b01a67b121e37c884af8b3357292311538b4d1eec3cfe403c0501b9877289050ab0ec4ffd7b1c",
		"authorIpfsHash": "QmQxx26HpNVBHYW997aYXmRvdKQj3Qh2HfV4BPVVgQM3Pz",
		"relayerIpfsHash": "QmWwVapgthezcunSwUtMamcrCDJHqJMLb4kbGWiyPt4H84",
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
