import json
from argparse import ArgumentParser

def get_parser():
    parser = ArgumentParser()
    parser.add_argument('--tweets')
    parser.add_argument('--geojson')
    return parser

if __name__ == '__main__':
    parser = get_parser()
    args = parser.parse_args()
    with open(args.tweets, 'r') as f:
        geo_data = {
            "type": "FeatureCollection",
            "features": []
        }
        for line in f:
            tweet = json.loads(line)
            try:
                if tweet['coordinates']:
                    geo_json_feature = {                      
                        "coordinates": tweet['coordinates']['coordinates']
                        }
                    geo_data['features'].append(geo_json_feature)
            except KeyError:
                continue
     
    with open(args.geojson, 'w') as fout:
        fout.write(json.dumps(geo_data, indent=4))
