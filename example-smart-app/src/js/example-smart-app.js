(function(window) {
    window.extractData = function() {
        return FHIR.oauth2.ready().then(function(client) {
            var observationCodes = [
                'http://loinc.org|8302-2',
                'http://loinc.org|8462-4',
                'http://loinc.org|8480-6',
                'http://loinc.org|2085-9',
                'http://loinc.org|2089-1',
                'http://loinc.org|55284-4'
            ].join(',');

            return Promise.all([
                client.patient.read(),
                client.patient.request(
                    'Observation?code=' + observationCodes,
                    { pageLimit: 0, flat: true }
                )
            ]).then(function(values) {
                var patient = values[0];
                var observations = values[1];
                var byCodes = client.byCodes(observations, 'code');

                var fname = '';
                var lname = '';
                if (patient.name && patient.name[0]) {
                    fname = patient.name[0].given ? patient.name[0].given.join(' ') : '';
                    lname = patient.name[0].family || '';
                }

                var height = byCodes('8302-2');
                var systolicbp = getBloodPressureValue(byCodes('55284-4'), '8480-6');
                var diastolicbp = getBloodPressureValue(byCodes('55284-4'), '8462-4');
                var hdl = byCodes('2085-9');
                var ldl = byCodes('2089-1');

                var p = defaultPatient();
                p.birthdate = patient.birthDate;
                p.gender = patient.gender;
                p.fname = fname;
                p.lname = lname;
                p.height = getQuantityValueAndUnit(height[0]);

                if (systolicbp !== undefined) {
                    p.systolicbp = systolicbp;
                }
                if (diastolicbp !== undefined) {
                    p.diastolicbp = diastolicbp;
                }

                p.hdl = getQuantityValueAndUnit(hdl[0]);
                p.ldl = getQuantityValueAndUnit(ldl[0]);

                return p;
            });
        });
    };

    function defaultPatient() {
        return {
            fname: { value: '' },
            lname: { value: '' },
            gender: { value: '' },
            birthdate: { value: '' },
            height: { value: '' },
            systolicbp: { value: '' },
            diastolicbp: { value: '' },
            ldl: { value: '' },
            hdl: { value: '' },
        };
    }

    function getBloodPressureValue( BPObservations, typeOfPressure ) {
        var formattedBPObservations = [];
        BPObservations.forEach(function( observation ) {
            var BP = observation.component ? observation.component.find(function( component ) {
                return component.code.coding.find(function( coding ) {
                    return coding.code == typeOfPressure;
                });
            }) : undefined;
            if (BP) {
                observation.valueQuantity = BP.valueQuantity;
                formattedBPObservations.push(observation);
            }
        });
        return getQuantityValueAndUnit(formattedBPObservations[0]);
    }

    function getQuantityValueAndUnit( ob ) {
        if (typeof ob != 'undefined' &&
            typeof ob.valueQuantity != 'undefined' &&
            typeof ob.valueQuantity.value != 'undefined' &&
            typeof ob.valueQuantity.unit != 'undefined') {
            return ob.valueQuantity.value + ' ' + ob.valueQuantity.unit;
        } else {
            return undefined;
        }
    }

    window.drawVisualization = function( p ) {
        $('#holder').show();
        $('#loading').hide();
        $('#fname').html(p.fname);
        $('#lname').html(p.lname);
        $('#gender').html(p.gender);
        $('#birthdate').html(p.birthdate);
        $('#height').html(p.height);
        $('#systolicbp').html(p.systolicbp);
        $('#diastolicbp').html(p.diastolicbp);
        $('#ldl').html(p.ldl);
        $('#hdl').html(p.hdl);
    };

})(window);
