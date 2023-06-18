export default function handler(req, res) {
    const google = require('googleapis');
    const { url } = req.query;
    //
    let jwtClient = new google.Auth.JWT(
        process.env.CLIENT_EMAIL,
        null,
        process.env.PRIVATE_KEY,
        ['https://www.googleapis.com/auth/spreadsheets']);

    //authenticate request
    jwtClient.authorize().then(ok => {

        //Google Sheets API
        var spreadsheetId = '1cGG66DyedVsMkFtBU5K4svfE1SoUQwdx2r9-p3Urb2w';
        var sheetRange = 'Sheet1!A2:B'
        const startAIdx = 2;
        var sheets = google.google.sheets('v4');
        //

        console.log("FROM");
        let path = req.headers.referer || req.headers.referrer;
        if (!path) {
            return res.status(404).send();
        }
        // check cors
        const regex = /https:\/\/taphng\.home\.blog*/g;
        const found = path.match(regex);

        if (!found) {
            return res.status(404).send();
        }

        let checkUrl = url;

        if (checkUrl.slice(-1) == '/') {
            // remove ending /
            checkUrl = checkUrl.slice(0, url.length - 1);
        }

        let sheetPathSplit = checkUrl.split('/');

        let sheetPath = sheetPathSplit[sheetPathSplit.length - 1];

        try {
            sheets.spreadsheets.values.get({
                auth: jwtClient,
                spreadsheetId: spreadsheetId,
                range: sheetRange,
            }).then((response) => {
                if (!response.data.values) {
                    response.data.values = [];
                }
                const result = JSON.stringify(response.data.values, null, 2);
                let arr = JSON.parse(result);
                let updated = false;

                for (let index = 0; index < arr.length; index++) {
                    if (arr[index][0] == sheetPath) {
                        updated = true;
                        // first increase view by 1
                        try {
                            console.log("UPDATING");
                            arr[index][1] = parseInt(arr[index][1]) + 1;
                            console.log(arr[index]);
                            let modifiedRange = `Sheet1!A${startAIdx + index}:B${startAIdx + index}`;
                            let values = [
                                [
                                    ...arr[index]
                                ]
                            ]
                            console.log(values);
                            sheets.spreadsheets.values.update({
                                auth: jwtClient,
                                spreadsheetId: spreadsheetId,
                                range: modifiedRange,
                                valueInputOption: 'RAW',
                                resource: {
                                    values
                                }
                            }).then((response2) => {
                                // then return current view
                                const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="30">
                                <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="clamp(1rem, 1rem + ((1vw - 0.2rem) * 0.471), 1.2rem)">${arr[index][1]} views</text>
                               </svg>`;
                               console.log(svg);
                                                                       res.setHeader('Content-Type', 'image/svg+xml');
                                                                       res.setHeader('Cache-Control', 'no-store');
                                                                       return res.status(200).send(svg);
                            });
                        } catch (err) {
                            return res.status(404).send();
                        }
                    }
                }
                // if not found
                // add new path
                if (!updated) {
                    try {
                        console.log("CREATING");
                        let modifiedRange = `Sheet1!A${startAIdx + arr.length}:B${startAIdx + arr.length}`;
                        let values = [
                            [
                                sheetPath,
                                parseInt('1')
                            ]
                        ]
                        console.log(values);
                        sheets.spreadsheets.values.update({
                            auth: jwtClient,
                            spreadsheetId: spreadsheetId,
                            range: modifiedRange,
                            valueInputOption: 'RAW',
                            resource: {
                                values
                            }
                        }).then((response) => {
                            // then return current view
                            const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="30">
                    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="clamp(1rem, 1rem + ((1vw - 0.2rem) * 0.471), 1.2rem)">1 views</text>
                  </svg>`;

                            res.setHeader('Content-Type', 'image/svg+xml');
                            res.setHeader('Cache-Control', 'no-store');
                            return res.status(200).send(svg);
                        });
                    } catch (err) {
                        return res.status(404).send();
                    }
                }
            });
        } catch (err) {
            return res.status(404).send();
        }
    });
}