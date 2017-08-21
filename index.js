require('dotenv').config({
    path: './conf.env'
})
const got = require('got')
const elasticsearch = require('elasticsearch')

const client = elasticsearch.Client({
    host: process.env.ELASTIC_HOST
    // log: 'trace'
})

let totalItemsIndexed = 0

async function init() {
    await createIndex()
    await updateMappings()

    readPage(0).then(() => {
        console.log('All done')
    })
}

function readPage(pageNumber) {
    return got(`${process.env.TV_MAZE_BASEURL}${pageNumber}`)
        .then(resp => JSON.parse(resp.body))
        .then(data => {
            return new Promise((resolve, reject) => {
                console.log(`[Debug]: Read page ${pageNumber} from TV Maze`)

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

                    body.push({
                        doc: show,
                        doc_as_upsert: true
                    })
                })

                client
                    .bulk({
                        body
                    })
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

    const indexExists = await client.indices.exists({
        index
    })

    if (!indexExists) {
        await client.indices.create({
            index
        })
    }
}

// Tuning
async function updateMappings() {
    const properties = {
        url: {
            type: 'text',
            index: 'not_analyzed'
        },
        type: {
            type: 'text',
            index: 'not_analyzed'
        },
        language: {
            type: 'text',
            index: 'not_analyzed'
        },
        status: {
            type: 'text',
            index: 'not_analyzed'
        },
        runtime: {
            type: 'long',
            index: 'not_analyzed'
        },
        premiered: {
            type: 'date',
            index: 'not_analyzed'
        },
        officialSite: {
            type: 'text',
            index: 'not_analyzed'
        },
        schedule: {
            properties: {
                time: {
                    type: 'text',
                    index: 'not_analyzed'
                },
                days: {
                    type: 'text',
                    index: 'not_analyzed'
                }
            }
        },
        network: {
            properties: {
                id: {
                    type: 'long',
                    index: 'not_analyzed'
                },
                name: {
                    type: 'text',
                    index: 'not_analyzed'
                },
                country: {
                    properties: {
                        name: {
                            type: 'text',
                            index: 'not_analyzed'
                        },
                        code: {
                            type: 'text',
                            index: 'not_analyzed'
                        },
                        timezone: {
                            type: 'text',
                            index: 'not_analyzed'
                        }
                    }
                }
            }
        },
        webChannel: {
            properties: {
                id: {
                    type: 'long',
                    index: 'not_analyzed'
                },
                name: {
                    type: 'text',
                    index: 'not_analyzed'
                },
                country: {
                    properties: {
                        name: {
                            type: 'text',
                            index: 'not_analyzed'
                        },
                        code: {
                            type: 'text',
                            index: 'not_analyzed'
                        },
                        timezone: {
                            type: 'text',
                            index: 'not_analyzed'
                        }
                    }
                }
            }
        },
        externals: {
            properties: {
                tvrage: {
                    type: 'long',
                    index: 'not_analyzed'
                },
                thetvtb: {
                    type: 'long',
                    index: 'not_analyzed'
                },
                imdb: {
                    type: 'text',
                    index: 'not_analyzed'
                }
            }
        },
        image: {
            properties: {
                medium: {
                    type: 'text',
                    index: 'not_analyzed'
                },
                original: {
                    type: 'text',
                    index: 'not_analyzed'
                }
            }
        },
        updated: {
            type: 'long',
            index: 'not_analyzed'
        },
        _links: {
            properties: {
                self: {
                    properties: {
                        href: {
                            type: 'text',
                            index: 'not_analyzed'
                        }
                    }
                },
                previousepisode: {
                    properties: {
                        href: {
                            type: 'text',
                            index: 'not_analyzed'
                        }
                    }
                },
                nextepisode: {
                    properties: {
                        href: {
                            type: 'text',
                            index: 'not_analyzed'
                        }
                    }
                }
            }
        },
        summary: {
            type: 'text',
            boost: 1
        },
        rating: {
            properties: {
                average: {
                    type: 'float',
                    boost: 0
                }
            }
        },
        name: {
            type: 'text',
            boost: 1
        },
        weight: {
            type: 'long',
            boost: 0
        }
    }

    client.indices.putMapping({
        index: process.env.ELASTIC_INDEX_NAME,
        type: 'show',
        body: {
            properties
        }
    })
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
