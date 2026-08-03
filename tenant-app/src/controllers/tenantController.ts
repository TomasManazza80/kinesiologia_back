class TenantController {
    async createTenant(req, res) {
        const tenantData = req.body;

        // Here you would typically validate the data and save it to a database
        // For now, we'll just simulate a successful creation response

        res.status(201).json({
            message: "Tenant created successfully",
            tenant: tenantData
        });
    }
}

export default new TenantController();