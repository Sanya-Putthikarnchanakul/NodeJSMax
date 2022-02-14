const deleteProduct = async (csrf, productId, btn) => {
    try {
        const productElement = btn.closest('article');

        const response = await fetch(
            `/admin/product/${productId}`,
            {
                method: 'DELETE',
                headers: {
                    'csrf-token': csrf
                }
            }
        );

        const data = await response.json();

        console.log(data);

        productElement.parentNode.removeChild(productElement);
    } catch (err) {
        console.log(err);
    }
}