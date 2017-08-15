require('dotenv').config({ path: './conf.env' })
const fs = require('fs')
const got = require('got')
const algoliasearch = require('algoliasearch')

const client = algoliasearch(
    process.env.ALGOLIA_APPID,
    process.env.ALGOLIA_APIKEY
)
const index = client.initIndex(process.env.ALGOLA_INDEX)
let totalItemsIndexed = 0

readPage(0).then(() => {
    console.log('All done')
})

function readPage(pageNumber) {
    return got(`${process.env.TV_MAZE_BASEURL}${pageNumber}`)
        .then(resp => JSON.parse(resp.body))
        .then(data => {
            return new Promise((resolve, reject) => {
                console.log(`[Debug]: Read page ${pageNumber} from TV Rage`)

                if (!data || data.length === 0)
                    throw Error(`No data found on page ${pageNumber}`)

                index.addObjects(data, err => {
                    if (err) reject()

                    totalItemsIndexed += data.length
                    console.log(
                        `[Debug]: Added ${data.length} records to Algolia. Total items indexed: ${totalItemsIndexed}`
                    )

                    setTimeout(() => resolve(readPage(pageNumber + 1)), 1000)
                })
            })
        })
        .catch(err => console.log(err))
}
