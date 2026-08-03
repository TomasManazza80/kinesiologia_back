
export async function updateProperty(req, res) {
    try {
        const propertyId = parseInt(req.params.id);
        if (isNaN(propertyId)) return res.status(400).json({ message: "Invalid property ID" });

        let updatedProperty;
        await AppDataSource.transaction(async manager => {
            const property = await manager.findOne('RealEstateObject', {
                where: { id: propertyId },
                relations: { images: true, units: true }
            });
            if (!property) throw new Error("Property not found");

            // Remove related fields to only update primitive ones
            const propertyUpdates = { ...req.body };
            delete propertyUpdates.units;
            delete propertyUpdates.images;

            await manager.update('RealEstateObject', propertyId, propertyUpdates);

            if (req.body.units && Array.isArray(req.body.units)) {
                // To keep it simple, we can update existing units or add new ones
                for (const unit of req.body.units) {
                    if (unit.id) {
                        const { images, ...unitData } = unit;
                        await manager.update('Unit', unit.id, unitData);
                        
                        if (images && Array.isArray(images)) {
                           // Update unit images
                           await manager.delete('Image', { unitId: unit.id });
                           const newImages = images.map(img => {
                               const imgUrl = typeof img === 'string' ? img : (img.url || img);
                               const imgFileId = typeof img === 'object' && img.fileId ? img.fileId : null;
                               return manager.create('Image', { imageUrl: imgUrl, fileId: imgFileId, unitId: unit.id, userId: req.user.userId });
                           });
                           await manager.save('Image', newImages);
                        }
                    } else {
                        const newUnit = manager.create('Unit', { ...unit, realEstateObjectId: propertyId });
                        await manager.save('Unit', newUnit);
                    }
                }
            }

            if (req.body.images && Array.isArray(req.body.images)) {
                // Replace all property images
                await manager.delete('Image', { realEstateObjectId: propertyId, unitId: null });
                const imagesToCreate = req.body.images.map(image => {
                    const imgUrl = typeof image === 'string' ? image : (image.url || image);
                    const imgFileId = typeof image === 'object' && image.fileId ? image.fileId : null;
                    return manager.create('Image', { imageUrl: imgUrl, fileId: imgFileId, realEstateObjectId: propertyId, userId: req.user.userId });
                });
                await manager.save('Image', imagesToCreate);
            }

            updatedProperty = await manager.findOne('RealEstateObject', { where: { id: propertyId }, relations: { units: true, images: true } });
        });

        res.status(200).json({ data: updatedProperty, message: "Property updated successfully" });
    } catch (error) {
        console.error("Error updating property:", error);
        if (error.message === "Property not found") {
            return res.status(404).json({ message: "Property not found" });
        }
        res.status(500).json({ message: "Error updating property" });
    }
}
