import recordToDataCite from './../utils/recordToDataCite'
import licenses from './../utils/licenses';
import regions from './../regions';
import mockMetadataRecord from '../__testData__/mockMetadataRecord';
import expectedDataCiteStructure from '../__testData__/expectedDataCiteStructure';

const language = 'en';
const region = 'hakai';
const datacitePrefix = "10.21966"

describe('recordToDataCite', () => {
    it('should correctly map metadata record to DataCite format', () => {

        const testResult = recordToDataCite(mockMetadataRecord, language, region, datacitePrefix);

        // Assert that the output matches the expected structure
        expect(testResult).toEqual(expectedDataCiteStructure);

    });
})