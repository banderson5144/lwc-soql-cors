import { LightningElement } from 'lwc';

export default class BasicDatatable extends LightningElement {
    data;
    columns;
    soqlStr;
    isSet = false;

    connectedCallback()
    {
        let myServ = this.getCookie('myServ');
        let mySess = this.getCookie('mySess');

        this.isSet = (myServ !== null && mySess !== null);
    }

    handleChange(event) {
        this.soqlStr = event.target.value;
    }

    getCookie(name) {
        var cookieString = '; ' + document.cookie;
        var parts = cookieString.split('; ' + name + '=');
        if (parts.length === 2) {
            return parts.pop().split(';').shift();
        }
        return null;
    }

    callQuery() {
        const myHeaders = new Headers();
        myHeaders.append('Authorization', 'Bearer ' + this.getCookie('mySess'));

        const sfServer =
            decodeURIComponent(this.getCookie('myServ')) +
            '/services/data/v52.0/query?q=' +
            encodeURIComponent(this.soqlStr);

        const myRequest = new Request(sfServer, {
            method: 'GET',
            headers: myHeaders,
            mode: 'cors',
            cache: 'default'
        });

        fetch(myRequest)
        .then((response) => response.json())
        .then((myJson) => {
            console.log(JSON.stringify(myJson));
            this.data = myJson.records;

            let newCols = [];

            for (const fld of Object.keys(myJson.records[0])) {
                if (fld !== 'attributes') {
                    newCols.push({ label: fld, fieldName: fld });
                }
            }

            this.columns = newCols;
        });
    }
}
