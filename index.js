require('dotenv').config({ path: './conf.env' })
const got = require('got')
const elasticsearch = require('elasticsearch')

const client = elasticsearch.Client({
    host: process.env.ELASTIC_HOST,
    log: 'trace'
})

async function init() {
    await createIndex()
}

async function createIndex() {
    const index = process.env.ELASTIC_INDEX_NAME

    const indexExists = await client.indices.exists({ index })

    if (!indexExists) {
        // TODO(AM): Add mappings.
        await client.indices.create({ index })
    }
}

client
    .ping()
    .then(() => {
        console.log('Connected to elastic search!')
        init()
    })
    .catch(() =>
        console.log(
            `Could not connect to elastic search at host ${process.env
                .ELASTIC_HOST}`
        )
    )
