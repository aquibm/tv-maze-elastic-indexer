require('dotenv').config({ path: './conf.env' })
const got = require('got')
const elasticsearch = require('elasticsearch')

const client = elasticsearch.Client({
    host: process.env.ELASTIC_HOST,
    log: 'trace'
})

client
    .ping()
    .then(() => console.log('Connected to elastic search!'))
    .catch(() =>
        console.log(
            `Could not connect to elastic search at host ${process.env
                .ELASTIC_HOST}`
        )
    )
