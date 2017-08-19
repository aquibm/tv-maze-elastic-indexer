require('dotenv').config({ path: './conf.env' })
const got = require('got')
const elasticsearch = require('elasticsearch')

const client = elasticsearch.Client({
    host: process.env.ELASTIC_HOST
    // log: 'trace'
})

let totalItemsIndexed = 0

async function init() {
    await createIndex()

    readPage(0).then(() => {
        console.log('All done')
    })
}

function readPage(pageNumber) {
    return got(`${process.env.TV_MAZE_BASEURL}${pageNumber}`)
        .then(resp => JSON.parse(resp.body))
        .then(data => {
            return new Promise((resolve, reject) => {
                console.log(`[Debug]: Read page ${pageNumber} from TV Rage`)

                if (!data || data.length === 0)
                    throw Error(`No data found on page ${pageNumber}`)

                const body = []

                data.forEach(show => {
                    body.push({
                        update: {
                            _index: process.env.ELASTIC_INDEX_NAME,
                            _type: 'show',
                            _id: show.id
                        }
                    })

                    body.push({ doc: show, doc_as_upsert: true })
                })

                client
                    .bulk({ body })
                    .then(() => {
                        totalItemsIndexed += data.length
                        console.log(
                            `[Debug]: Indexed ${totalItemsIndexed} shows so far...`
                        )

                        setTimeout(
                            () => resolve(readPage(pageNumber + 1)),
                            1000
                        )
                    })
                    .catch(reject)
            })
        })
        .catch(err => console.log(err))
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
