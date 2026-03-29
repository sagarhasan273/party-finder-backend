export type ReturnResponseType = {
    message: string;
    status: boolean;
} | {
    data: any;
    metaData: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
    };
};

export interface user {
    sub: string;
    email: string;
    name: string;
    picture: string;
}

declare global {
    namespace Express {
        interface Request {
            user?: user;
        }
    }
}
