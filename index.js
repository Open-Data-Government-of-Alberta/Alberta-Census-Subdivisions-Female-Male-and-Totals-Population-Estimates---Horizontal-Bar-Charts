const log = console.log;

d3.csv("alberta_census_subdivisions(2001-2017).csv")
  .then(function(csvData) {

    //Fix Náre name
    //Convert Year, Sex, and Total to ints
    csvData.forEach(element => {
        if(element["Area Name"] === "Thabacha N�re 196A") element["Area Name"] = "Thabacha Náre 196A";

        csvData.columns.forEach(d => {
            if(d !== "Area Name") element[d] = parseInt(element[d]);
        });
    });

    //Nested Area Names by Year
    const years = d3.nest().key(d => d["Year"]).key(d => d["Area Name"]).entries(csvData);
    //Used this and commented years for rapid prototyping
    // const years = d3.range(0, 4).map(p => d3.nest().key(d => d["Year"]).key(d => d["Area Name"]).entries(csvData)[p]);
    const sexesAndTotal = years[0].values[0].values.map(d => d["Sex"]);
    const legendScale = d3.scaleOrdinal().domain(sexesAndTotal).range(["Female", "Male", "Total"]);
    const yearsDivsHTML = years.map(d => {
        return `
        <div class="item">
            <div class="${d.key}" style="width: 700px; height: 338px; overflow-x: hidden; overflow-y: scroll;">
                <div id="${d.key}" style="height: 12000px;" class="item-content"></div>
            </div>
        </div>`;
    }).reduce((acc, curVal) => acc + curVal, "");

    //Muuri Grid 
    const sortAsc = document.querySelector(".sort-ascend");
    const sortDesc = document.querySelector(".sort-descending");

    d3.select(".grid").html(yearsDivsHTML);
    const grid = new Muuri('.grid', {
        layoutOnInit: false, 
        layout: {
            horizontal: true
        },
        sortData: {
            className: (item, element) => parseInt(element.children[0].className)
        }
    });

    //Viz title Data Driven
    d3.select("#titleID").html(`Alberta Census Subdivisions 
                                     Population Estimates (${years[0].key} - ${years[years.length - 1].key})`);

    //Sort for Muuri
    grid.sort("className", {layout: "instant"});
    sortAsc.addEventListener("click", () => grid.sort("className"));
    sortDesc.addEventListener("click", () => grid.sort("className:desc"));

    //Each year echarts init and setOption
    years.forEach(d => {
        const year = d.key;
        const myChart = echarts.init(document.getElementById(d.key), "custom-essos");
        let yearValues = d.values;
        yearValues = yearValues.map(d => d).sort((a, b) => a.values[0]["Total"] - b.values[0]["Total"]);

        const areaNamesData = sexesAndTotal.map((p, i) => {
            return {
                name: legendScale(p), 
                type: "bar",
                label: {
                    show: true,
                    position: "right",
                    fontSize: 9,
                    formatter: params => `${params.value.toLocaleString()}`
                },
                data:yearValues.map(v => v.values[i]["Total"])  
            };
        });
        const option = {
            toolbox: {
                show: true,
                orient: "vertical",
                showTitle: false,
                feature: {
                    saveAsImage: {},
                    dataView: {
                        readOnly: true
                    }
                }
            },
            title : {
                text: `${year}`
            },
            legend:{},
            grid: {
                left: "37%",
                right: "8%",
                bottom: "0%",
            },
            xAxis: {
                type: "value",
                show: false
            },
            yAxis: {
                name: `${year} Population Estimate`,
                type: "category",
                data: yearValues.map(v => v.key),
                boundaryGap: true,
                axisLabel: {
                    interval: 0,
                    showMaxLabel: true,
                    showMinLabel: true,
                    fontSize: 10
                },
                axisTick:{
                    interval: 0,
                    alignWithLabel: true 
                }
            },
            series: areaNamesData
        };

        myChart.setOption(option);
    });
});