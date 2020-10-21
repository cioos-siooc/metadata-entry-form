#!/usr/bin/env python3

from distutils.core import setup
import setuptools

setup(name='firebase_to_xml',
      version='0.1',
      description='Python module translates metadata records from' +
      'Firebase into XML',
      url='https://github.com/cioos-siooc/metadata-entry-form',
      packages=setuptools.find_packages(),
      include_package_data=True,
      install_requires=[
          'google-auth',
          'google-oauth',
          'python-dotenv',
          'metadata_xml@git+git://github.com/cioos-siooc/metadata-xml.git'
      ]
      )
