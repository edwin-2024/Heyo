# Heyo Domain Glossary

Canonical vocabulary and ubiquitous language for the Heyo platform. All specifications, database schemas, code, and UI copy must strictly conform to these definitions.

## Tenancy & Organizations

**Workspace**:
A distinct tenant environment representing a single business website and its isolated support resources.
_Avoid_: Account, project, instance, tenant

**Business Owner**:
The authenticated individual who signs up, creates the Workspace, and manages its knowledge and live support. In v1, each Workspace has exactly one Business Owner.
_Avoid_: Admin, customer, user, client

**Operator**:
Any human agent authorized to view inboxes and answer visitor chats in real time. In v1, the Operator is exclusively the Business Owner; in v2, Operators can be invited team members.
_Avoid_: Agent (when referring to humans), support rep, staff

## Visitors & Chat

**Visitor**:
An end user browsing the customer's website who interacts with the Heyo chat widget.
_Avoid_: User, customer, client

**Identified Visitor**:
A Visitor whose identity has been verified via the host application's SDK passing attributes (email, name).
_Avoid_: Logged-in user, registered visitor

**Conversation**:
An ongoing or historic message thread between a single Visitor and the Heyo platform within a specific Workspace.
_Avoid_: Chat session, ticket, thread

**Message**:
A single unit of communication within a Conversation, sent by a Visitor, the AI Agent, or a human Operator.
_Avoid_: Comment, event, reply

## AI Support Pipeline & Handoff

**AI Agent**:
The autonomous, knowledge-grounded assistant responsible for answering on-topic Visitor queries using verified documentation.
_Avoid_: Bot, chatbot, assistant, AI rep

**Intent Classifier**:
The Step 3 pre-retrieval gatekeeper that inspects incoming Visitor messages to filter out off-topic requests, attacks, or pleasantries before vector searching.
_Avoid_: Filter, moderation bot, router

**Handoff**:
The explicit transition of a Conversation's state from `AI_ANSWERING` to `WAITING_HUMAN` when confidence is insufficient or when human help is requested.
_Avoid_: Escalation, transfer, ticket creation

## Knowledge & Storage

**Document**:
A source file (.pdf, .md, .txt) uploaded to a Workspace's knowledge base.
_Avoid_: File, attachment, article

**Document Chunk**:
A segmented, token-bounded slice of a Document paired with a dense vector embedding for similarity retrieval.
_Avoid_: Vector, passage, excerpt
