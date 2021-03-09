#!/usr/bin/env python3

"""
Setup file for firebase_to_yaml
"""

from distutils.core import setup

setup(
    name="firebase_to_xml",
    version="0.1",
    description="Python module translates metadata records from" + "Firebase into XML",
    url="https://github.com/cioos-siooc/metadata-entry-form",
    packages=["firebase_to_xml"],
    include_package_data=True,
    install_requires=[
        "google-auth",
        "google-oauth",
        "python-dotenv",
        "metadata_xml@git+git://github.com/cioos-siooc/metadata-xml.git@development",
    ],
)
