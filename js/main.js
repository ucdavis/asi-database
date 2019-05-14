MyApp = {};
MyApp.spreadsheetData = [];
MyApp.keywords = [];
MyApp.headerData = [
    { "sTitle": "Title" }, { "sTitle": "Program" }, { "sTitle": "Year" }, { "sTitle": "Type" }, { "sTitle": "region" }, { "sTitle": "organizations" }, { "sTitle": "categories" }
];
MyApp.filterIndexes = { "regions": 5, "categories" : 7 };
MyApp.Organizations = [], MyApp.Regions = [], MyApp.categories = [];

String.prototype.trunc = function (n) {
    return this.substr(0, n - 1) + (this.length > n ? '&hellip;' : '');
};

var buffer = (function() {
    this.buf = new Array();
    this.popFirst = false;
    this.flush = function() {
        this.write(this.buf);
        this.buf.length = 0;
    }
    this.write = function(rows) {
        return MyApp.oTable.rows.add(rows).draw(false);
    }
    return function(row) {
        if(row) {
            this.buf.push(row);
            if(!this.popFirst) {
                this.popFirst = true;
                this.flush();
            }
            if(this.buf.length > 25) {
                this.flush();
            }
        }
        return this;
    }.bind(this)
})();

function getFile(file, program) {
    let shared;
    if(file.shared_link != null) {
        shared = new Promise(function(resolve, reject){
            resolve(file);
        });
    }
    else {
        shared = $.ajax({url: `https://api.box.com/2.0/files/${file.id}`, 
            headers: {
                'Authorization': "Bearer " + accessToken.toString()
            },
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify({
                shared_link: {
                    access: 'open'
                }
            })
        });
    }
    let request = $.ajax({url: `https://api.box.com/2.0/files/${file.id}/metadata`, 
    headers: {
        'Authorization': "Bearer " + accessToken.toString()
    }
    });
    let both = Promise.all([shared, request]).then(function([shared_link, response]){
        return new Promise((resolve, reject) => {
            try {
                let val = response.entries[0];
                let download = {download_url: `https://ucdavis.app.box.com/embed/s/${shared_link.shared_link.url.split('/')[4]}`}
                val.title = val.title || this.name;
                val.size = this.size;
                var prog = program || "ASI";
                var year = val.year || "";
                var type = val.type || "";

                var orgtype = val.organization || "";

                var region = val.region || "";
                var categories = val.categories || "";

                // var allResearchInfo = val.gsx$gsx:positiontitle.$t + '<br />' + val.gsx$telephone.$t + '<br />' + val.gsx$categories.$t;
                
                buffer(
                    [
                        GenerateTitleColumn(val, download), 
                        prog, 
                        year, 
                        type,
                        orgtype,
                        region, categories
                    ]);

                if ($.inArray(orgtype, MyApp.Organizations) === -1 && orgtype.length !== 0) {
                    MyApp.Organizations.push(orgtype);
                }
                if ($.inArray(region, MyApp.Regions) === -1 && region.length !== 0) {
                    MyApp.Regions.push(region);
                }

                /*
                if ($.inArray(keyword, MyApp.keywords) === -1 && keyword.length !== 0) {
                    MyApp.keywords.push(keyword);
                }
                */

                /* DOH */
                //Add the keywords, which are semi-colon separated. First trim them and then replace the CRLF, then split.
                $.each(categories.trim().replace(/^[\r\n]+|\.|[\r\n]+$/g, "").split(';'), function (key, val) {
                    val = val.trim(); //need to trim the semi-colon separated values after split
                    
                    if ($.inArray(val, MyApp.categories) === -1 && val.length !== 0) {
                        MyApp.categories.push(val);
                    }
                });

                resolve()
            }
            catch(error) {
                reject(error)
            }
        })
    }.bind(file));

    return both;
}
function getFolderItems(folder, program) {
    return $.ajax({url: `https://api.box.com/2.0/folders/${folder}/items?fields=shared_link,name,size&limit=1000`, 
    headers: {
        'Authorization': "Bearer " + accessToken.toString()
    }
    }).then(response => {
    let entries = response.entries;
    var promises = [];
    for(file of entries) {
        if(file.type=="file") {
            let both = getFile(file, program);
            promises.push(both);
        }
        else if(file.type=="folder") {
            let p = program;
            if(!program) {
                p = file.name;
            }
            promises.push(getFolderItems(file.id, p));
        }
    }
    return Promise.all(promises)
    }, error => console.error(error));
}

$(function () {
    createDataTable();

    var url = "https://spreadsheets.google.com/feeds/list/1y7A89kMdcA8_uGTky0ec5Qksj4g9cIIpm4veVYrNDb4/1/public/values?alt=json-in-script&callback=?";
    $.get('/js/252054_wwtn361q_config.json').done(data => {
        getAccessToken(data).then(response => {
            accessToken = response.access_token;
            let getItems = getFolderItems(69213161846);
            getItems.then(function(){ 
                buffer().flush();
                MyApp.Organizations.sort();
                MyApp.Regions.sort();
                MyApp.categories.sort();
                //MyApp.keywords.sort();

                addFilters();
            })
            }, error => console.error(error));
    });
})

function hideUnavailableOrganizations(){
    var fileredData = MyApp.oTable._('tr', {"filter":"applied"});

    //Get departments available after the filters are set
    MyApp.Organizations = [];
    $.each(fileredData, function (key, val) {
        var org = val[MyApp.filterIndexes["organizations"]];

        if ($.inArray(org, MyApp.Organizations) === -1 && org.length !== 0) {
                MyApp.Organizations.push(org);
        }
    });

    // $(":checkbox", "#organizations").each(function () {
    //     //if a checkbox isn't in the list of available departments, hide it
    //     if ($.inArray(this.name, MyApp.Organizations) === -1) {
    //         $(this).parent().css("display", "none");
    //     } else {
    //         $(this).parent().css("display", "block");
    //     }
    // });
}


function addFilters(){
    // var $organizations = $("#organizations");
    
    // $.each(MyApp.Organizations, function (key, val) {
    //     $organizations.append('<li><label><input type="checkbox" name="' + val + '"> ' + val + '</label></li>');
    // });


    var $region = $("#regions");
    
    $.each(MyApp.Regions, function (key, val) {
        $region.append('<li><label><input type="checkbox" name="' + val + '"> ' + val + '</label></li>');
    });


    var $researcharea = $("#researcharea");
    
    $.each(MyApp.categories, function (key, val) {
        $researcharea.append('<li><label><input type="checkbox" name="' + val + '"> ' + val + '</label></li>');
    });


    $(".filterrow").on("click", "ul.filterlist", function (e) {
        var filterRegex = "";
        var filterName = this.id;
        var filterIndex = MyApp.filterIndexes[filterName];

        var filters = [];
        $("input", this).each(function (key, val) {
            if (val.checked) {
                if (filterRegex.length !== 0) {
                    filterRegex += "|";
                }

                filterRegex += val.name; //Use the hat and dollar to require an exact match                
            }
        });

        MyApp.oTable.fnFilter(filterRegex, filterIndex, true, false);
        hideUnavailableOrganizations();
        displayCurrentFilters();
    });

    $("#clearfilters").click(function (e) {
        e.preventDefault();

        $(":checkbox", "ul.filterlist").each(function () {
            this.checked = false;
        });

        $("ul.filterlist").click();
    });
}

function GenerateTitleColumn(val /* entry value from spreadsheet */, download){
    var name = val.title || "";
    // var title = val.gsx$positiontitle.$t;
    var website = val.size == 0 ? (val.link || "") : "";
    //var website = "<a target='_blank' href='" + val.gsx$website.$t + "'>" + val.gsx$website.$t + "</a>";
    //var email = "<a href='mailto:" + val["gsx$e-mail"].$t + "'>" + val["gsx$e-mail"].$t + "</a>";
    // var allResearchInfo = "Research areas: " + val.gsx$categories.$t;
    // var allResearchInfo = val.gsx$categories.$t;

    // var content = allResearchInfo; //could expand content later
    var title = 
    (website !== "" ? "<a href='"+ website +"' target=_blank>" : "<span>") + 
    name
     + (website !== "" ? "</a>" : "</span>") +
     ((!website && download) ? 
     "<a href='" + download.download_url + "' target=_blank >" +
     "<i class='fa fa-download' aria-hidden='true'></i>" +
     "</a>" : "")
     ;
        
    return title;
}



function displayCurrentFilters() {
    var $filterAlert = $("#filters");
    //var regionFilter = $("#regions"); // Wrong selector..?
    
    var filters = "";

    /*
    if (regionFilter){
        filters += "<strong>" + this.name + "</strong>";
    }
    */

    $("input:checked", "#filterAccordian").each(function () {
        if (filters.length !== 0) {
            filters += " + "
        }
        filters += "<strong>" + this.name + "</strong>";
    });

    if (filters.length !== 0) {
        var alert = $("<div class='alert alert-info'><strong>Filters</strong><p>You are filtering on " + filters + "</p></div>")

        $filterAlert.html(alert);
        $filterAlert[0].scrollIntoView(true);
    } else {
        $filterAlert.html(null);
    }
}

function createDataTable() {
    //Create a sorter that uses case-insensitive html content
    jQuery.extend(jQuery.fn.dataTableExt.oSort, {
        "link-content-pre": function (a) {
            return $(a).html().trim().toLowerCase();
        },

        "link-content-asc": function (a, b) {
            return ((a < b) ? -1 : ((a > b) ? 1 : 0));
        },

        "link-content-desc": function (a, b) {
            return ((a < b) ? 1 : ((a > b) ? -1 : 0));
        }
    });

    MyApp.oTable = $("#spreadsheet").DataTable({
        "columnDefs": [
            //{ "sType": "link-content", "aTargets": [ 0 ] },
            {width: "30px", targets: [2]}, 
            {width: "10%", targets: [1]},
            {width: "20%", targets: [3]},
            { "visible": false, "targets": [ -2, -3, -1 ] } //hide the keywords column for now (the last column, hence -1)
        ],
        "iDisplayLength": 20,
        "bLengthChange": false,
        "data": MyApp.spreadsheetData,
        "aoColumns": MyApp.headerData,
        order: [[1, "asc"]]
    });
}