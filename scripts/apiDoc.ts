import * as fs from 'node:fs'
import * as path from 'node:path'

import Joi from 'joi'
import j2s from 'joi-to-swagger'
import swaggerAutogen from 'swagger-autogen'

import { AddressController } from '../src/controllers/v1/AddressController'
import { AIController } from '../src/controllers/v1/AIController'
import { AuthorizationController as UserAuthorizationController } from '../src/controllers/v1/AuthorizationController'
import { CategoryController } from '../src/controllers/v1/CategoryController'
import { FileUpload } from '../src/controllers/v1/FileUpload'
import { GoodController } from '../src/controllers/v1/GoodController'
import { ItemTypeController } from '../src/controllers/v1/ItemTypeController'
import { SelectionistController } from '../src/controllers/v1/SelectionistController'
import { TagController } from '../src/controllers/v1/TagController'
import { UsersController } from '../src/controllers/v1/UserController'

/**
 * Link all endpoints to their schemas
 * Requirements:
 *   - All schema names must be under the valid category: v1.getUser
 *   - Schema names and endpoint names must be the same getUser (endpoint Name) === getUser (Schema name)
 * All new endpoints must be listed here
 * */
const schemas: {[key: string]: {[key: string]: any}} = {
    v1: {
        // Auth
        register: UserAuthorizationController.schemas,
        login: UserAuthorizationController.schemas,
        forgotPassword: UserAuthorizationController.schemas,
        logout: UserAuthorizationController.schemas,
        resetPassword: UserAuthorizationController.schemas,
        googleRedirect: UserAuthorizationController.schemas,
        completeRegistration: UserAuthorizationController.schemas,
        me: UserAuthorizationController.schemas,

        // Address
        getAddresses: AddressController.schemas,
        putAddress: AddressController.schemas,
        deleteAddress: AddressController.schemas,
        
        // File Upload
        putFile: FileUpload.schemas,

        // AI
        postTranslations: AIController.schemas,
        postGoodMetadata: AIController.schemas,

        // Category
        getCategories: CategoryController.schemas,
        getAdminCategories: CategoryController.schemas,
        putCategory: CategoryController.schemas,
        deleteCategory: CategoryController.schemas,

        // Item Type
        getItemTypes: ItemTypeController.schemas,
        putItemType: ItemTypeController.schemas,
        deleteItemType: ItemTypeController.schemas,

        // Selectionist
        getSelectionists: SelectionistController.schemas,
        putSelectionist: SelectionistController.schemas,
        deleteSelectionist: SelectionistController.schemas,

        // Tag
        getTags: TagController.schemas,
        getAdminTags: TagController.schemas,
        putTag: TagController.schemas,
        deleteTag: TagController.schemas,

        // Good
        getGoods: GoodController.schemas,
        getGood: GoodController.schemas,
        postGood: GoodController.schemas,
        patchGood: GoodController.schemas,
        deleteGood: GoodController.schemas,

        // User
        getUser: UsersController.schemas,
        getUsers: UsersController.schemas,
        patchUser: UsersController.schemas,
        deleteUser: UsersController.schemas

    }
}

/**
 * Converts Joi schema to a simplified custom schema format:
 * - Removes "additionalProperties"
 * - Removes "required" arrays
 * - Removes "type" fields unless structural (object/array)
 * - Works recursively for nested objects/arrays
 * - Formats leaf nodes as "type format required"
 */

function joiToCustomSwagger(node: any, key: string | null = null, parentRequired: string[] = []): any {
    if (!node || typeof node !== 'object') {
        return node
    }
    if ('additionalProperties' in node) {
        delete node.additionalProperties
    }

    // Handle arrays
    if (node.type === 'array') {
        const items = node.items ? joiToCustomSwagger(node.items, null, []) : {}
        const constraintParts: string[] = []

        if (node.minItems) {
            constraintParts.push(`minItems:${node.minItems}`)
        }
        if (node.maxItems) {
            constraintParts.push(`maxItems:${node.maxItems}`)
        }
        if (node.length) {
            constraintParts.push(`length:${node.length}`)
        }

        const base = Array.isArray(items) || typeof items === 'object' ? [items] : [String(items)]
        if (constraintParts.length > 0) {
            base.push(`(${constraintParts.join(' ')})`)
        }

        return base
    }

    // Handle objects and inline their properties
    if (node.properties && typeof node.properties === 'object') {
        const requiredKeys: string[] = Array.isArray(node.required) ? node.required : []
        const out: Record<string, any> = {}

        for (const [propName, propNode] of Object.entries(node.properties)) {
            const transformed = joiToCustomSwagger(propNode, propName, requiredKeys)

            if (typeof transformed === 'string') {
                out[propName] = requiredKeys.includes(propName) && !transformed.includes('required')
                    ? `${transformed} required`
                    : transformed
            } else {
                out[propName] = transformed
            }
        }

        return out
    }

    // Handle primitive leaf nodes (string, integer, boolean, etc.)
    if (node.type && node.type !== 'object' && node.type !== 'array') {
        const parts: string[] = []

        if (node.type) {
            parts.push(node.type)
        }
        if (node.format) {
            parts.push(node.format)
        }

        // Add min/max/length constraints depending on type
        if (node.type === 'string') {
            if (node.minLength) {
                parts.push(`min:${node.minLength}`)
            }
            if (node.maxLength) {
                parts.push(`max:${node.maxLength}`)
            }
            if (node.length) {
                parts.push(`length:${node.length}`)
            }
        }
        if (node.type === 'integer' || node.type === 'number') {
            if (node.minimum) {
                parts.push(`min:${node.minimum}`)
            }
            if (node.maximum) {
                parts.push(`max:${node.maximum}`)
            }
        }

        // Add 'required' if applicable
        const isRequired = key !== null && parentRequired.includes(key)
        if (isRequired) {
            parts.push('required')
        }

        return parts.join(' ')
    }

    // Fallback for unrecognized structures
    const result: any = Array.isArray(node) ? [] : {}
    for (const key of Object.keys(node)) {
        result[key] = joiToCustomSwagger(node[key], null, [])
    }
    return result
}

const definitions: any = {}

Object.keys(schemas).forEach((version) => {
    Object.keys(schemas[version]).forEach((endpoint) => {
        const reference = `${version}${endpoint.charAt(0).toUpperCase() + endpoint.slice(1)}`

        const controllerSchemas = schemas[version][endpoint]
        const reqSchema = controllerSchemas.request[endpoint]
        const resSchema = controllerSchemas.response[endpoint]
        if (!Joi.isSchema(reqSchema)) {
            throw new Error('Is not a request schema: ' + version + endpoint)
        }

        if (!Joi.isSchema(resSchema)) {
            throw new Error('Is not a response schema: ' + version +endpoint)
        }

        definitions[`${reference}ReqBody`] = joiToCustomSwagger(j2s(reqSchema).swagger?.properties)
        definitions[`${reference}Res`] = joiToCustomSwagger(j2s(resSchema).swagger?.properties)
    })
})

const doc = {
    info: {
        title: 'Flower Shop API',
        description: 'Description'
    },
    host: 'localhost:3000',
    definitions
}

const distDir = path.join(__dirname, '../dist')
const apiDocDir = path.join(__dirname, '../dist/apiDoc')

const outFile = 'swaggerApi.json'

if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir)
}

if (!fs.existsSync(apiDocDir)) {
    fs.mkdirSync(apiDocDir)
}

swaggerAutogen()(path.join(apiDocDir, outFile), [path.join(__dirname, '../src/routes/*.ts')], doc)