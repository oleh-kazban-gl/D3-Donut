(function(d3) {
    'use strict';

    var settings = {
        url: 'https://gist.githubusercontent.com/olehkazban/e9e3b919497561971e2db638036f6d07/raw/sample.json',
        chartDimensions: {
            width: 960,
            height: 500,
            inner: 80
        },
        legendDimensions: {
            size: 18,
            spacing: 4
        },
        isTooltipEnabled: true,
        isFilteringEnabled: true
    };

    settings.chartDimensions.radius = Math.min(settings.chartDimensions.width, settings.chartDimensions.height) / 2;

    var color;

    var arc = d3.arc()
        .outerRadius(settings.chartDimensions.radius - 10)
        .innerRadius(settings.chartDimensions.radius - settings.chartDimensions.inner);

    var labelArc = d3.arc()
        .outerRadius(settings.chartDimensions.radius - 20)
        .innerRadius(settings.chartDimensions.radius - 20);

    var pie = d3.pie()
        .sort(null)
        .value(function(d) { return d.value; });

    var svg = d3.select("#chart").append("svg")
        .attr("width", settings.chartDimensions.width)
        .attr("height", settings.chartDimensions.height)
        .append("g")
        .attr("transform", "translate(" + settings.chartDimensions.width / 2 + "," + settings.chartDimensions.height / 2 + ")");

    getData(settings.url);

    function getColor() {
        color = d3.scaleOrdinal()
            .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);
    }

    function getData(url) {
        d3.request(url)
            .mimeType('application/json')
            .response(function(xhr) {
                return JSON.parse(xhr.responseText);
            })
            .get(function(err, data) {
                if (err) {
                    throw err;
                }

                initChart(data);
            });

        // the same
        // d3.json(url, function(err, data) {
        //     if (err) {
        //         throw err;
        //     }

        //     initChart(data);
        // });
    }

    function initChart(data) {
        data.forEach(function(d) {
            d.value = +d.value;
            d.enabled = true;
        });

        getColor(data);

        var path = svg.selectAll('path')
            .data(pie(data))
            .enter()
            .append('path')
            .attr('d', arc)
            .attr('fill', function(d, i) {
                return color(d.data.label);
            })
            .each(function(d) {
                this._current = d;
            });

        if (settings.isTooltipEnabled) {
            var tooltip = d3.select('#chart')
                .append('div')
                .attr('class', 'tooltip');

            tooltip.append('div')
                .attr('class', 'label');
            tooltip
                .append('div').attr('class', 'count');
            tooltip
                .append('div').attr('class', 'percent');

            path.on('mouseover', function(d) {
                var total = d3.sum(data.map(function(d) {
                    return d.enabled ? d.value : 0;
                }));

                var percent = Math.round(1000 * d.data.value / total) / 10;

                tooltip.select('.label').html(d.data.label);
                tooltip.select('.count').html(d.data.value);
                tooltip.select('.percent').html(percent + '%');
                tooltip.style('display', 'block');
            });

            path.on('mouseout', function() {
                tooltip.style('display', 'none');
            });
        }

        var legend = svg.selectAll('.legend')
            .data(color.domain())
            .enter()
            .append('g')
            .attr('class', 'legend')
            .attr('transform', function(d, i) {
                var height = settings.legendDimensions.size + settings.legendDimensions.spacing;
                var offset = height * color.domain().length / 2;
                var horz = -2 * settings.legendDimensions.size;
                var vert = i * height - offset;
                return 'translate(' + horz + ',' + vert + ')';
            });

        legend.append('rect')
            .attr('width', settings.legendDimensions.size)
            .attr('height', settings.legendDimensions.size)
            .style('fill', color)
            .style('stroke', color)
            .on('click', function(label) {
                if (!settings.isFilteringEnabled) {
                    return;
                }

                var rect = d3.select(this);
                var enabled = true;
                var totalEnabled = d3.sum(data.map(function(d) {
                    return (d.enabled) ? 1 : 0;
                }));

                if (rect.attr('class') === 'disabled') {
                    rect.attr('class', '');
                } else {
                    if (totalEnabled < 2) {
                        return;
                    }

                    rect.attr('class', 'disabled');
                    enabled = false;
                }

                pie.value(function(d) {
                    if (d.label === label) {
                        d.enabled = enabled;
                    }

                    return (d.enabled) ? d.value : 0;
                });

                path = path.data(pie(data));

                path.transition()
                    .duration(750)
                    .attrTween('d', function(d) {
                        var interpolate = d3.interpolate(this._current, d);
                        this._current = interpolate(0);

                        return function(t) {
                            return arc(interpolate(t));
                        };
                    });
            });

        legend.append('text')
            .attr('x', settings.legendDimensions.size + settings.legendDimensions.spacing)
            .attr('y', settings.legendDimensions.size - settings.legendDimensions.spacing)
            .text(function(d) {
                return d;
            });
    }

})(window.d3);