# Toolkit marks

`simple-icons.svg` is one SVG sprite holding the 28 brand marks the toolkit section uses,
and nothing else. The page fetches it once and inlines it, and each mark is drawn with
`<use href="#si-<slug>">` inside an SVG with `fill="currentColor"`, so it takes the ink
colour of the theme. No mark is shown in its brand colours.

## Source and licence

- [Simple Icons](https://simpleicons.org), npm package `simple-icons`, version **16.36.0**
  (published 25 October 2026), integrity
  `sha512-+VNPPkqSOLidFeSgBKUWX4n50WPpDC09hav+BgS26anIF1oQOlGBb8LvwGR+6fYRjo+B6CiKzNBceMPkSVXANQ==`.
- The Simple Icons icon data is released under [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/).
  Simple Icons lists five of the marks used here under Apache-2.0: Apache Airflow,
  Apache Spark, Apache Kafka, Apache Hadoop and Apache Superset.
- The paths are copied unchanged. `tools/build_icons.py` rebuilds the sprite from an
  unpacked package, taking the slugs from `MARKS` in `data.js`.

## Trademarks

Every brand name and mark here is a trademark of its owner. The marks are used only to
identify the tools named beside them. Their use does not mean that any owner endorses
this site or is affiliated with it.

## Marks used

apacheairflow, apachehadoop, apachekafka, apachespark, apachesuperset, claude, databricks,
docker, elasticsearch, githubactions, googlebigquery, grafana, kibana, langgraph, mongodb,
mysql, nginx, nodedotjs, pandas, postgresql, prefect, react, snowflake, square, streamlit,
terraform, typescript, zoho.

## Monogram fallbacks

Some tools have no mark in Simple Icons: the AWS and Microsoft marks (and others) were
removed at their owners' request, and some were never in it. These are not recreated or
taken from anywhere else. Each one gets a monogram instead, set in Geist Mono inside a thin
outlined square, in the same ink colour as the marks:

| Tool | Monogram |
| --- | --- |
| dbt | dbt |
| AWS (core stack) | AWS |
| AWS Glue, Glue | GL |
| AWS Step Functions, Step Functions | SF |
| Amazon Redshift, Redshift | RS |
| AWS Athena, Athena | AT |
| EC2 | EC2 |
| S3 | S3 |
| RDS | RDS |
| Lambda | LM |
| API Gateway | API |
| EventBridge | EB |
| CloudFront | CF |
| CloudWatch | CW |
| SNS | SNS |
| Secrets Manager | SM |
| SSM | SSM |
| IAM | IAM |
| ECS | ECS |
| Fargate | FG |
| Power BI | PBI |
| Twilio | TW |
| Telnyx | TX |
| Cotality / CoreLogic | CT |
| Instant Merge | IM |
| LoanSafe | LS |
| ValueLink | VL |

Practices, patterns and standards (for example "Data contracts", "CI/CD", "SSA-89",
"MISMO") are tags with no mark.
