import rethinkdb as r
import json
from flask import g
from utils import Status, error_response
from args import json_as_format_arg

_userAccessMatrix = {}

def checkAccess(user, itemOwner):
    if user == itemOwner:
        return True
    if user not in _userAccessMatrix:
        loadUserIntoUserAccessMatrix(user)
    return accessAllowed(user, itemOwner)

def loadUserIntoUserAccessMatrix(user):
    groups = list(r.table('usergroups').filter(r.row['users'].contains(user)).run(g.conn))
    _userAccessMatrix[user] = {}
    for group in groups:
        for username in group['users']:
            _userAccessMatrix[user][username] = True

def accessAllowed(user, itemOwner):
    return itemOwner in _userAccessMatrix[user]

def removeUserFromAccessMatrix(user):
    if user in _userAccessMatrix:
        _userAccessMatrix.pop(user, None)

def checkAccessResponseSingle(user, item):
    return checkAccessResponseSingleUsing(user, item, lambda i: json_as_format_arg(i))

def checkAccessResponseList(user, items):
    return checkAccessResponseListUsing(user, items, lambda i: json_as_format_arg(i))

def checkAccessResponseSingleUsing(user, item, l):
    if not item:
        return error_response(422)
    elif not checkAccess(user, item['owner']):
        return error_response(403)
    else:
        return l(item)

def checkAccessResponseListUsing(user, items, l):
    if not items:
        return error_response(422)
    else:
        owner = items[0]['owner']
        if not checkAccess(user, owner):
            return error_response(403)
        else:
            return l(items)

def checkDatafileAccess(user, item):
    if not item:
        return Status.FAILURE
    elif not checkAccess(user, item['owner']):
        return Status.ACCESS_NOT_ALLOWED
    else:
        return Status.SUCCESS

def checkOwnership(usergroup, signed_in_user):
    ug = r.table('usergroups').get(usergroup).run(g.conn)
    owners =  json.dumps(ug['owner'])
    if signed_in_user in owners:
        return True
