from firebase_to_xml.dump_all import main as retrieve_records
import click

from loguru import logger
import shutil
import os

FIREBASE_SERVICE_ACCOUNT_KEY = os.getenv("FIREBASE_KEY_PATH") or os.getenv(
    "FIREBASE_SERVICE_ACCOUNT_KEY"
)


@click.command()
@click.option(
    "--regions",
    required=True,
    help="List comma separated list of regions to retrieve records from",
    envvar="REGIONS",
)
@click.option(
    "--output",
    "--out",
    required=True,
    help="Folder to save xml",
    default="xml",
    envvar="OUTPUT_DIR",
)
@click.option(
    "--auth_key",
    required=True,
    help="Firebase Auth key json string or path to json file",
    default=FIREBASE_SERVICE_ACCOUNT_KEY,
)
@click.option(
    "--database_url",
    required=True,
    envvar="FIREBASE_DATABASE_URL",
    help="Firebase database URL",
)
@click.option(
    "--also-save-yaml",
    "--yaml",
    is_flag=True,
    help="Whether to output yaml file as well as xml",
    default=True,
)
@click.option(
    "--encoding",
    default="utf-8",
    help="Encoding of the output files",
)
@click.option(
    "--delete",
    is_flag=True,
    help="Whether to delete the output directory before writing",
    default=True,
)
@click.option(
    "--organizations",
    help="Use organizations.json to standardize owner names",
    envvar="ORGANIZATIONS",
    default="organizations.json",
)
@click.option(
    "--split-by-owner",
    type=str,
    default="",
    help="Comma separated list of regions for which datasets are divided by owner",
    envvar="SPLIT_BY_OWNER",
)
def main(
    regions,
    output,
    auth_key,
    database_url,
    also_save_yaml=False,
    encoding="utf-8",
    delete=True,
    organizations="organizations.json",
    split_by_owner="",
):
    if delete:
        # delete output directory
        logger.info("Deleting output directory {}", output)
        shutil.rmtree(output, ignore_errors=True)
        logger.info("Output directory deleted")

    # get list of records from Firebase
    logger.info("Retrieving {} records from Firebase", regions)
    retrieve_records(
        regions,
        auth_key,
        output,
        database_url,
        also_save_yaml=also_save_yaml,
        encoding=encoding,
        organizations=organizations,
        split_by_owner=split_by_owner,
    )
    logger.info("Records retrieved from Firebase and saved to XML")


if __name__ == "__main__":
    main()
