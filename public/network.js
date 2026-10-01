function getWindowSize(parent_div) {
    const canvasDiv = document.getElementById(parent_div);
    const width = canvasDiv.offsetWidth;
    const height = (width / 16) * 9

    return { "width": width, "height": height }
}

function filterBasedOnChallenge(dataset, challenge) {
    let nodes = dataset.nodes
    let show_edge = 1 / nodes.length
    let status = true

    for (let i = 0; i < nodes.length; i++) {
        let edge = show_edge + (i * show_edge)

        if (challenge > edge) {
            nodes[i].show = true
            nodes[i].category = 1

            if (i < 5) {
                nodes[i].category = 0
            }

        }
        else {
            nodes[i].show = false

            if (status && i >= 5) {
                for (let y = 1; y <= 5; y++) {
                    nodes[i - y].category = 1
                }
                status = false
            }
        }

    }

    nodes = nodes.filter(e => {
        return e.show === true;
    })

    dataset.nodes = nodes
    return dataset
}

async function initNetwork(settings, user) {
    let div = settings.div
    let file = settings.file
    let challenge = user.progress
    let window_size = getWindowSize(div)

    const response = await fetch(file);
    let dataset = await response.json();

    var myChart = echarts.init(document.getElementById(div), null, {
        width: window_size.width,
        height: window_size.height
    });

    dataset = filterBasedOnChallenge(dataset, challenge)

    option = {
        tooltip: {
        },
        // legend: [
        //     {
        //         data: graph.categories.map(function (a) {
        //             return a.name;
        //         })
        //     }
        // ],
        series: [
            {
                name: 'Superhrdina',
                type: 'graph',
                layout: 'none',
                data: dataset.nodes,
                links: dataset.links,
                categories: [0, 1],
                roam: true,
                label: {
                    show: false,
                    position: 'right',
                    formatter: '{b}'
                },
                labelLayout: {
                    hideOverlap: true
                },
                emphasis: {
                    focus: 'adjacency',
                    lineStyle: {
                        width: 5
                    }
                },
                scaleLimit: {
                    min: 1,
                    max: 4
                },
                lineStyle: {
                    color: 'source',
                    curveness: 0.3,
                    width: 0.5,
                    opacity: 0.5
                }
            }
        ]
    };
    myChart.setOption(option);

}

// let settings = { "div": "challengeDiv", "file": "dataset.json" }
// let user = { "user": "Michal Vorlíček", "progress": 0.1 }
// initNetwork(settings, user);